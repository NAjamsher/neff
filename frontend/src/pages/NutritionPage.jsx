import { useState, useEffect } from 'react'
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅', target_pct: 0.25 },
  { key: 'lunch', label: 'Lunch', emoji: '☀️', target_pct: 0.35 },
  { key: 'evening_snack', label: 'Evening Snack', emoji: '🍎', target_pct: 0.10 },
  { key: 'dinner', label: 'Dinner', emoji: '🌙', target_pct: 0.30 },
]

function MacroBar({ label, current, target, color }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neff-muted">{label}</span>
        <span className="text-white">{Math.round(current)} / {target}</span>
      </div>
      <div className="h-1.5 bg-neff-border rounded-full">
        <div className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MealSection({ meal, entries, targets, onAddFood }) {
  const [expanded, setExpanded] = useState(true)

  const mealEntries = entries.filter(e => e.meal_type === meal.key)
  const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0)
  const mealProtein = mealEntries.reduce((sum, e) => sum + e.protein_g, 0)
  const mealCarbs = mealEntries.reduce((sum, e) => sum + e.carbs_g, 0)
  const mealFats = mealEntries.reduce((sum, e) => sum + e.fats_g, 0)

  const mealCalTarget = Math.round(targets.calories * meal.target_pct)

  return (
    <div className="neff-card mb-3">
      {/* Meal Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{meal.emoji}</span>
          <div>
            <p className="text-white font-semibold">{meal.label}</p>
            <p className="text-neff-muted text-xs">
              {Math.round(mealCalories)} / {mealCalTarget} kcal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-neff-muted text-xs">
              P: {Math.round(mealProtein)}g · 
              C: {Math.round(mealCarbs)}g · 
              F: {Math.round(mealFats)}g
            </p>
          </div>
          {expanded
            ? <ChevronUp size={16} className="text-neff-muted" />
            : <ChevronDown size={16} className="text-neff-muted" />
          }
        </div>
      </div>

      {/* Calorie bar */}
      <div className="h-1 bg-neff-border rounded-full mt-3">
        <div
          className="h-1 bg-neff-green rounded-full transition-all"
          style={{
            width: `${Math.min(100, (mealCalories / mealCalTarget) * 100)}%`
          }}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-3">
          {/* Food entries */}
          {mealEntries.length > 0 && (
            <div className="space-y-2 mb-3">
              {mealEntries.map((entry, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-neff-border last:border-0">
                  <div>
                    <p className="text-white text-sm capitalize">{entry.food_name}</p>
                    <p className="text-neff-muted text-xs">{entry.quantity}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neff-green text-sm">{entry.calories} kcal</p>
                    <p className="text-neff-muted text-xs">
                      P:{entry.protein_g}g C:{entry.carbs_g}g F:{entry.fats_g}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add food button */}
          <button
            onClick={() => onAddFood(meal.key)}
            className="flex items-center gap-2 text-neff-green text-sm hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Add Food
          </button>
        </div>
      )}
    </div>
  )
}

export default function NutritionPage() {
  const [todayData, setTodayData] = useState(null)
  const [activeMeal, setActiveMeal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState(100)
  const [isLogging, setIsLogging] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  useEffect(() => {
    fetchTodayData()
  }, [])

  const fetchTodayData = async () => {
    try {
      const res = await api.get('/nutrition/today')
      setTodayData(res.data)
    } catch {}
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await api.get(`/nutrition/foods/search/${searchQuery}`)
      setSearchResults(res.data.results)
    } catch {}
  }

  const handleLogFood = async () => {
    if (!selectedFood || !activeMeal) return
    setIsLogging(true)
    try {
      await api.post('/nutrition/log', {
        food_name: selectedFood.name,
        quantity,
        meal_type: activeMeal,
      })
      setSelectedFood(null)
      setSearchQuery('')
      setSearchResults([])
      setActiveMeal(null)
      await fetchTodayData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to log food')
    } finally {
      setIsLogging(false)
    }
  }

  const handleAskAI = async () => {
    if (!aiQuery.trim()) return
    setIsAsking(true)
    try {
      const res = await api.post('/nutrition/ai-suggest', { query: aiQuery })
      setAiSuggestion(res.data.suggestion)
    } catch {
      setAiSuggestion('Failed to get suggestion. Try again.')
    } finally {
      setIsAsking(false)
    }
  }

  const totals = todayData?.totals || { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }
  const targets = todayData?.targets || { calories: 2000, protein_g: 150 }
  const entries = todayData?.entries || []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Nutrition</h1>
        <p className="text-neff-muted mt-1">Track your daily food intake</p>
      </div>

      {/* Daily Summary Card */}
      <div className="neff-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold">Daily Summary</h2>
          <span className="text-neff-green font-bold text-lg">
            {Math.round(totals.calories)}
            <span className="text-neff-muted text-sm font-normal">
              /{targets.calories} kcal
            </span>
          </span>
        </div>

        {/* Calorie progress */}
        <div className="h-3 bg-neff-border rounded-full mb-4">
          <div
            className="h-3 bg-neff-green rounded-full transition-all"
            style={{
              width: `${Math.min(100, (totals.calories / targets.calories) * 100)}%`
            }}
          />
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4">
          <MacroBar
            label="Protein"
            current={totals.protein_g}
            target={targets.protein_g}
            color="bg-blue-400"
          />
          <MacroBar
            label="Carbs"
            current={totals.carbs_g}
            target={300}
            color="bg-yellow-400"
          />
          <MacroBar
            label="Fats"
            current={totals.fats_g}
            target={70}
            color="bg-red-400"
          />
        </div>
      </div>

      {/* Meal Sections */}
      {MEALS.map(meal => (
        <MealSection
          key={meal.key}
          meal={meal}
          entries={entries}
          targets={targets}
          onAddFood={(mealKey) => {
            setActiveMeal(mealKey)
            setSelectedFood(null)
            setSearchQuery('')
            setSearchResults([])
          }}
        />
      ))}

      {/* Food Search Modal */}
      {activeMeal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neff-card border border-neff-border rounded-xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold capitalize">
                Add to {MEALS.find(m => m.key === activeMeal)?.label}
              </h3>
              <button
                onClick={() => setActiveMeal(null)}
                className="text-neff-muted hover:text-white"
              >✕</button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <input
                className="neff-input flex-1"
                placeholder="Search food... (rice, paneer, eggs)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                autoFocus
              />
              <button onClick={handleSearch} className="neff-btn px-3">
                <Search size={16} />
              </button>
            </div>

            {/* Results */}
            {searchResults.length > 0 && !selectedFood && (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {searchResults.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFood(food)}
                    className="w-full flex justify-between items-center px-3 py-2.5 rounded-lg border border-neff-border hover:border-neff-green transition-colors text-left"
                  >
                    <span className="text-white text-sm capitalize">
                      {food.name}
                    </span>
                    <span className="text-neff-muted text-xs">
                      {food.calories} kcal / {food.per}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFood && (
              <div>
                <div className="bg-neff-border rounded-lg p-3 mb-4">
                  <p className="text-white font-medium capitalize mb-1">
                    {selectedFood.name}
                  </p>
                  <p className="text-neff-muted text-xs">
                    {selectedFood.calories} kcal · {selectedFood.protein}g protein per 100g
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-neff-muted text-sm mb-1.5 block">
                    Quantity (grams)
                  </label>
                  <input
                    className="neff-input"
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value))}
                  />
                  <p className="text-neff-green text-xs mt-1">
                    ≈ {Math.round(selectedFood.calories * quantity / 100)} kcal ·
                    {Math.round(selectedFood.protein * quantity / 100)}g protein
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="neff-btn-secondary flex-1 bg-neff-border text-white px-4 py-2.5 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleLogFood}
                    disabled={isLogging}
                    className="neff-btn flex-1 disabled:opacity-50"
                  >
                    {isLogging ? 'Adding...' : 'Add Food'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Nutrition Coach */}
      <div className="neff-card mt-4">
        <h2 className="text-white font-semibold mb-1">AI Nutrition Coach</h2>
        <p className="text-neff-muted text-sm mb-4">
          Ask about your meals — "How is my lunch?" or "What should I eat for dinner?"
        </p>

        <div className="flex gap-2 mb-4">
          <input
            className="neff-input flex-1"
            placeholder="How is my lunch looking?"
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAI()}
          />
          <button
            onClick={handleAskAI}
            disabled={isAsking || !aiQuery.trim()}
            className="neff-btn px-4 disabled:opacity-50"
          >
            {isAsking ? '...' : 'Ask'}
          </button>
        </div>

        {aiSuggestion && (
          <div className="bg-neff-border rounded-lg p-4">
            <p className="text-neff-green text-xs font-medium mb-2">
              AI SUGGESTION
            </p>
            <p className="text-white text-sm leading-relaxed">
              {aiSuggestion}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}