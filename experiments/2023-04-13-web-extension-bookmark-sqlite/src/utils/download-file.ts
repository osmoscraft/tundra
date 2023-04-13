export async function downloadFile(file: File) {
  const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker({
    suggestedName: file.name,
  });
  const writable = await (handle as any).createWritable();
  await writable.write(file);
  await writable.close();
}
