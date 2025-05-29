interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  avatar?: string
}

export class ContactsIntegration {
  /**
   * 실제 Contact Picker API를 사용하여 연락처 가져오기
   */
  static async getContacts(): Promise<Contact[]> {
    try {
      // Contact Picker API 지원 확인
      if (!("contacts" in navigator) || !("ContactsManager" in window)) {
        throw new Error("Contact Picker API가 지원되지 않습니다")
      }

      // @ts-ignore - Contact Picker API는 실험적 기능
      const contacts = await navigator.contacts.select(["name", "tel", "email"], {
        multiple: true,
      })

      // 연락처 데이터 포맷팅
      const formattedContacts: Contact[] = contacts.map((contact: any, index: number) => ({
        id: `real-contact-${index}`,
        name: contact.name?.[0] || "이름 없음",
        phone: contact.tel?.[0] || undefined,
        email: contact.email?.[0] || undefined,
      }))

      return formattedContacts
    } catch (error: any) {
      console.log("Contact Picker API 사용 실패:", error.message)
      throw error
    }
  }

  /**
   * 데모용 연락처 데이터 반환
   */
  static getDemoContacts(): Contact[] {
    return [
      {
        id: "demo-1",
        name: "어머니",
        phone: "010-1234-5678",
        email: "mom@family.com",
      },
      {
        id: "demo-2",
        name: "아버지",
        phone: "010-2345-6789",
        email: "dad@family.com",
      },
      {
        id: "demo-3",
        name: "김철수",
        phone: "010-3456-7890",
        email: "chulsoo@example.com",
      },
      {
        id: "demo-4",
        name: "이영희",
        phone: "010-4567-8901",
        email: "younghee@example.com",
      },
      {
        id: "demo-5",
        name: "박민수",
        phone: "010-5678-9012",
        email: "minsu@example.com",
      },
      {
        id: "demo-6",
        name: "최지영",
        phone: "010-6789-0123",
        email: "jiyoung@example.com",
      },
      {
        id: "demo-7",
        name: "정우진",
        phone: "010-7890-1234",
        email: "woojin@example.com",
      },
      {
        id: "demo-8",
        name: "한소영",
        phone: "010-8901-2345",
        email: "soyoung@example.com",
      },
      {
        id: "demo-9",
        name: "조민호",
        phone: "010-9012-3456",
        email: "minho@example.com",
      },
      {
        id: "demo-10",
        name: "윤서연",
        phone: "010-0123-4567",
        email: "seoyeon@example.com",
      },
    ]
  }

  /**
   * Contact Picker API 지원 여부 확인
   */
  static isContactPickerSupported(): boolean {
    return "contacts" in navigator && "ContactsManager" in window
  }

  /**
   * 브라우저 정보와 지원 상태 반환
   */
  static getBrowserSupport() {
    const userAgent = navigator.userAgent
    let browserName = "Unknown"
    let isSupported = false

    if (userAgent.includes("Chrome")) {
      browserName = "Chrome"
      const chromeVersion = Number.parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || "0")
      isSupported = chromeVersion >= 80
    } else if (userAgent.includes("Edge")) {
      browserName = "Edge"
      const edgeVersion = Number.parseInt(userAgent.match(/Edge\/(\d+)/)?.[1] || "0")
      isSupported = edgeVersion >= 80
    } else if (userAgent.includes("Firefox")) {
      browserName = "Firefox"
      isSupported = false // Firefox는 Contact Picker API 미지원
    } else if (userAgent.includes("Safari")) {
      browserName = "Safari"
      isSupported = false // Safari는 Contact Picker API 미지원
    }

    return {
      browserName,
      isSupported,
      hasContactsAPI: this.isContactPickerSupported(),
    }
  }
}
