// AI worker giả lập, chạy ngầm trong bản mẫu. Không có giao diện riêng.
// Mỗi việc trong hàng đợi (check-in mới, bản tin tuần…) được lập kế hoạch bằng lib/aiPipeline.js,
// các bước được "chạy" dần với độ trễ ngắn, rồi kết quả được ghi vào kho dữ liệu:
// nhãn trên check-in, thông báo cho đúng người, bản tin, lịch sử chạy.
// Người dùng thấy kết quả ngay tại màn hình họ đang dùng, và bấm nhãn "Do AI tạo" để xem AI đã làm gì.
// Bản thật là một tiến trình nền ở backend; giao diện không bao giờ tự gọi AI.
import { useEffect, useRef } from 'react';
import { useStore } from '../lib/store.jsx';
import { planCheckinRun, planDigestRun } from '../lib/aiPipeline.js';

const STEP_MS = 450;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function AiWorker() {
  const { state, dispatch } = useStore();
  const ref = useRef(state);
  ref.current = state;
  const busy = useRef(false);

  useEffect(() => {
    const job = state.aiQueue[0];
    if (!job || busy.current) return;
    busy.current = true;
    run(job, ref.current, dispatch).finally(() => {
      dispatch({ type: 'aiDequeue', id: job.id });
      busy.current = false;
    });
  }, [state.aiQueue, dispatch]);

  return null;
}

async function run(job, st, dispatch) {
  const fail = st.aiFail;
  const plan = job.flow === 'WEEKLY_DIGEST'
    ? planDigestRun(job.managerId, st, { fail })
    : planCheckinRun(job.flow, st.checkins.find((c) => c.id === job.checkinId), st, { fail });
  const runId = `r-${job.id}`;
  const t0 = Date.now();
  // Hiện dần từng bước, để ai mở ngăn "AI đã làm gì?" trong lúc chạy sẽ thấy tiến trình thật.
  const trace = { id: job.id, runId, flow: plan.flow, subject: plan.subject, status: 'running', summary: '', steps: plan.steps.map((s) => ({ ...s, status: 'pending' })) };
  const push = () => dispatch({ type: 'aiTrace', trace: { ...trace, steps: trace.steps.map((s) => ({ ...s })) } });
  for (let i = 0; i < plan.steps.length; i++) {
    if (plan.steps[i].status === 'skipped') { trace.steps[i] = { ...plan.steps[i] }; continue; }
    trace.steps[i] = { ...trace.steps[i], status: 'running' };
    push();
    await sleep(plan.steps[i].key === 'response' && plan.status === 'error' && fail ? STEP_MS * 3 : STEP_MS);
    trace.steps[i] = { ...plan.steps[i] };
  }
  trace.status = plan.status;
  trace.summary = plan.summary;
  push();

  const ids = job.flow === 'BLOCKER_ROUTING' ? { blockerRunId: runId } : job.flow === 'CHECKIN_MISMATCH' ? { mismatchRunId: runId } : {};
  dispatch({
    type: 'aiApply',
    run: { id: runId, ...plan.run, durationMs: Date.now() - t0 },
    insight: plan.insight ? { ...plan.insight, ...ids } : undefined,
    notifications: plan.notifications,
    digest: plan.digest ? { ...plan.digest, runId } : undefined,
  });
}
