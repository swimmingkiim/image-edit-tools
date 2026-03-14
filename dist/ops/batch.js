import { pipeline } from './pipeline.js';
export async function batch(inputs, operations, options = {}) {
    const concurrency = options.concurrency ?? 4;
    const results = new Array(inputs.length);
    const queue = inputs.map((input, index) => ({ input, index }));
    let active = 0;
    let doneCount = 0;
    let currentIndex = 0;
    return new Promise((resolve) => {
        const checkQueue = () => {
            if (doneCount === inputs.length) {
                resolve(results);
                return;
            }
            while (active < concurrency && currentIndex < queue.length) {
                active++;
                const item = queue[currentIndex++];
                pipeline(item.input, operations).then((res) => {
                    results[item.index] = res;
                }).catch((err) => {
                    results[item.index] = { ok: false, error: err.message, code: 'PROCESSING_FAILED' };
                }).finally(() => {
                    active--;
                    doneCount++;
                    if (options.onProgress) {
                        options.onProgress(doneCount, inputs.length);
                    }
                    checkQueue();
                });
            }
        };
        checkQueue();
    });
}
//# sourceMappingURL=batch.js.map