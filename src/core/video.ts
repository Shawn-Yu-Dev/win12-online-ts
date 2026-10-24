import { apps } from './app-registry';

export function closeVideo(): void {
  const video = apps.camera?.video as HTMLVideoElement | undefined;
  if (!video) return;
  try {
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  } catch {}
}
