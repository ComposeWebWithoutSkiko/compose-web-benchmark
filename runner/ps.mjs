// Reading `ps`, for the runners that can't ask the browser for the CPU time of its processes
// (safari.mjs, firefox.mjs).

/** The seconds of a CPU time printed by `ps`: [[days-]hours:]minutes:seconds. */
export function parseCpuTime(time) {
    const [days, clock] = time.includes('-') ? time.split('-') : ['0', time];
    return Number(days) * 86_400 + clock.split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
}
