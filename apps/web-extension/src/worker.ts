declare const self: DedicatedWorkerGlobalScope;

console.log("[worker] online");

if (self.crossOriginIsolated) {
  console.log("[worker] OK: crossOriginIsolated");
} else {
  console.error("[worker] Disabled: crossOriginIsolated");
}

async function main() {}

main();

export default self;
