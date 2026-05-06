import { nanoid } from "nanoid";

export function generateId(): string {
  return nanoid(12);
}

export function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function resizeImage(
  file: File,
  maxWidth: number,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
