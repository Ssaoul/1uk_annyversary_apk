import type React from "react"
import { CalendarPlus } from "lucide-react"
import { useAnniversaries } from "@/hooks/use-anniversaries"

interface MainScreenProps {
  userId: string
}

const MainScreen: React.FC<MainScreenProps> = ({ userId }) => {
  // useAnniversaries 훅 호출 시 사용자 정보 확인
  const { anniversaries, loading, error, getUpcomingAnniversaries, getCumulativeAnniversaries, toggleFavorite } =
    useAnniversaries(userId)

  // 데이터가 없을 때 표시할 메시지 추가
  const upcomingAnniversaries = getUpcomingAnniversaries()
  const cumulativeAnniversaries = getCumulativeAnniversaries()

  // 데이터가 없을 때 표시할 메시지 컴포넌트
  const EmptyState = () => (
    <div className="text-center py-10 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CalendarPlus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">기념일이 없습니다</h3>
      <p className="text-sm text-gray-500 mb-4">하단의 + 버튼을 눌러 첫 기념일을 추가해보세요!</p>
    </div>
  )

  return (
    <div>
      {/* Your main screen content here */}
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {anniversaries.length === 0 && !loading && !error && <EmptyState />}
      {anniversaries.length > 0 && (
        <>
          {/* Display anniversaries here */}
          <p>Upcoming Anniversaries: {upcomingAnniversaries.length}</p>
          <p>Cumulative Anniversaries: {cumulativeAnniversaries.length}</p>
        </>
      )}
    </div>
  )
}

export default MainScreen
