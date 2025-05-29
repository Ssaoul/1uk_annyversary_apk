import { put } from "@vercel/blob"

export class ImageService {
  // 이미지 업로드
  static async uploadImage(file: File): Promise<string | null> {
    try {
      const blob = await put(file.name, file, {
        access: "public",
      })

      return blob.url
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }

  // 이미지 삭제 (필요시 구현)
  static async deleteImage(url: string): Promise<boolean> {
    // Vercel Blob에서 이미지 삭제 로직
    // 현재는 간단히 true 반환
    return true
  }
}
