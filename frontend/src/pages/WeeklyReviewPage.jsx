import { useState, useEffect } from 'react'
import { Sparkles, Calendar, Dumbbell, Heart } from 'lucide-react'
import api from '../services/api'

export default function WeeklyReviewPage() {
  const [review, setReview] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/review/history')
      .then(r => setHistory(r.data.reviews))
      .catch(() => {})
  }, [])

  const generateReview = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await api.get('/review/weekly')
      setReview(res.data)
      setHistory(prev => [res.data, ...prev])
    } catch {
      setError('Failed to generate review. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Weekly Review</h1>
        <p className="text-neff-muted mt-1">
          AI analysis of your week — wins, areas to improve, next week's focus
        </p>
      </div>

      {/* Generate Button */}
      <div className="neff-card mb-6 text-center">
        <Sparkles className="text-neff-green mx-auto mb-3" size={32} />
        <h2 className="text-white font-semibold text-lg mb-2">
          Generate This Week's Review
        </h2>
        <p className="text-neff-muted text-sm mb-4">
          AI will analyze your workouts, recovery, and consistency
        </p>
        <button
          onClick={generateReview}
          disabled={isLoading}
          className="neff-btn disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : '✨ Generate Review'}
        </button>
        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}
      </div>

      {/* Latest Review */}
      {review && (
        <div className="neff-card mb-6 border border-neff-green/30">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <Calendar size={18} className="text-neff-green mx-auto mb-1" />
              <p className="text-white font-bold text-xl">
                {review.workouts_completed}
              </p>
              <p className="text-neff-muted text-xs">
                of {review.planned_workouts} workouts
              </p>
            </div>
            <div className="text-center">
              <Heart size={18} className="text-blue-400 mx-auto mb-1" />
              <p className="text-white font-bold text-xl">
                {review.avg_recovery || '—'}
              </p>
              <p className="text-neff-muted text-xs">avg recovery</p>
            </div>
            <div className="text-center">
              <Dumbbell size={18} className="text-purple-400 mx-auto mb-1" />
              <p className="text-white font-bold text-xs mt-1">
                {review.week_start} — {review.week_end}
              </p>
              <p className="text-neff-muted text-xs">week period</p>
            </div>
          </div>

          {/* AI Review Text */}
          <div className="bg-neff-border rounded-lg p-4">
            <p className="text-neff-green text-xs font-medium mb-2">
              AI COACH REVIEW
            </p>
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">
              {review.review}
            </p>
          </div>
        </div>
      )}

      {/* Past Reviews */}
      {history.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-4">Past Reviews</h2>
          <div className="space-y-4">
            {history.map((r, i) => (
              <div key={i} className="neff-card">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-neff-muted text-sm">
                    {r.week_start} — {r.week_end}
                  </p>
                  <span className="text-neff-green text-xs">
                    {r.workouts_completed} workouts
                  </span>
                </div>
                <p className="text-white text-sm leading-relaxed whitespace-pre-line">
                  {r.review}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}