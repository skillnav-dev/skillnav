import { markStart, reportRun } from "./report-run.mjs";

/**
 * Universal pipeline runner.
 *
 * main() should return:
 *   { pipeline?, status, summary, errorMsg?, exitCode }
 *
 * On throw, catches and reports as failure.
 * dry-run skips DB reporting.
 */
export async function runPipeline(
  mainFn,
  { logger, defaultPipeline, dryRunFlag = "--dry-run" }
) {
  markStart();
  const dryRun = process.argv.includes(dryRunFlag);
  let result;

  try {
    result = await mainFn();
    if (!result)
      result = { status: "success", summary: {}, exitCode: 0 };
  } catch (e) {
    logger.error(e.message);
    result = {
      status: "failure",
      summary: {},
      errorMsg: e.message,
      exitCode: 1,
    };
  }

  const pipeline = result.pipeline || defaultPipeline;

  if (!dryRun) {
    await reportRun(
      pipeline,
      result.status,
      result.summary || {},
      result.errorMsg || null
    );
  }

  logger.done();
  if (result.exitCode) process.exit(result.exitCode);
}
