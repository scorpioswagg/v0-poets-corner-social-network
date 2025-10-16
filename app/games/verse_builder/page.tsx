"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Zap, 
  RotateCcw, 
  Home, 
  Trophy, 
  Clock, 
  CheckCircle,
  XCircle,
  Shuffle
} from "lucide-react"

// Word banks for different themes
const WORD_BANKS = {
  nature: {
    nouns: ["moon", "river", "forest", "mountain", "ocean", "valley", "meadow", "canyon"],
    adjectives: ["gentle", "majestic", "serene", "wild", "ancient", "crystal", "golden", "silver"],
    verbs: ["flows", "whispers", "dances", "shines", "grows", "breathes", "sings", "glows"],
    prepositions: ["through", "over", "beneath", "above", "within", "around", "across", "beyond"]
  },
  love: {
    nouns: ["heart", "soul", "dream", "kiss", "embrace", "promise", "memory", "hope"],
    adjectives: ["tender", "passionate", "eternal", "sweet", "pure", "warm", "deep", "true"],
    verbs: ["loves", "cherishes", "holds", "remembers", "dreams", "wishes", "treasures", "adores"],
    prepositions: ["with", "for", "in", "through", "beyond", "within", "above", "around"]
  },
  melancholy: {
    nouns: ["tears", "shadow", "silence", "loneliness", "memory", "regret", "sorrow", "night"],
    adjectives: ["quiet", "deep", "heavy", "cold", "empty", "distant", "faded", "lost"],
    verbs: ["falls", "lingers", "fades", "whispers", "cries", "remembers", "longs", "yearns"],
    prepositions: ["in", "through", "within", "beneath", "behind", "beyond", "around", "above"]
  }
}

const THEMES = Object.keys(WORD_BANKS) as Array<keyof typeof WORD_BANKS>

export default function VerseBuilderGame() {
  const [user, setUser] = useState<any>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu')
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof WORD_BANKS>('nature')
  const [availableWords, setAvailableWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState<string[]>([])
  const [lines, setLines] = useState<string[][]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
    }
    getUser()
  }, [supabase, router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      endGame()
    }
    return () => clearInterval(interval)
  }, [gameState, timeLeft])

  const startGame = async () => {
    const words = [
      ...WORD_BANKS[selectedTheme].nouns,
      ...WORD_BANKS[selectedTheme].adjectives,
      ...WORD_BANKS[selectedTheme].verbs,
      ...WORD_BANKS[selectedTheme].prepositions
    ]
    setAvailableWords(words)
    setSelectedWords([])
    setCurrentLine([])
    setLines([])
    setTimeLeft(300)
    setGameStartTime(Date.now())
    setGameState('playing')

    // Create game record
    try {
      const { data: gameData } = await supabase
        .from("games")
        .select("id")
        .eq("game_type", "verse_builder")
        .single()

      if (gameData) {
        setGameId(gameData.id)
      }
    } catch (error) {
      console.error("Error creating game record:", error)
    }
  }

  const endGame = async () => {
    setGameState('finished')
    
    // Calculate score based on lines created and word usage
    const lineCount = lines.length + (currentLine.length > 0 ? 1 : 0)
    const wordCount = selectedWords.length
    const finalScore = (lineCount * 100) + (wordCount * 10)
    setScore(finalScore)

    // Save score to database
    if (user && gameId) {
      try {
        const timeTaken = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0
        await supabase
          .from("game_scores")
          .insert({
            user_id: user.id,
            game_id: gameId,
            score: finalScore,
            time_taken: timeTaken,
            game_data: {
              theme: selectedTheme,
              lines: lines,
              current_line: currentLine,
              total_words_used: wordCount
            }
          })
      } catch (error) {
        console.error("Error saving score:", error)
      }
    }
  }

  const selectWord = (word: string) => {
    if (gameState !== 'playing' || selectedWords.includes(word)) return

    setSelectedWords(prev => [...prev, word])
    setCurrentLine(prev => [...prev, word])
  }

  const removeWordFromLine = (index: number) => {
    if (gameState !== 'playing') return

    const word = currentLine[index]
    setCurrentLine(prev => prev.filter((_, i) => i !== index))
    setSelectedWords(prev => prev.filter(w => w !== word))
  }

  const finishLine = () => {
    if (gameState !== 'playing' || currentLine.length === 0) return

    setLines(prev => [...prev, [...currentLine]])
    setCurrentLine([])
  }

  const shuffleWords = () => {
    setAvailableWords(prev => [...prev].sort(() => Math.random() - 0.5))
  }

  const getWordType = (word: string) => {
    if (WORD_BANKS[selectedTheme].nouns.includes(word)) return 'noun'
    if (WORD_BANKS[selectedTheme].adjectives.includes(word)) return 'adjective'
    if (WORD_BANKS[selectedTheme].verbs.includes(word)) return 'verb'
    if (WORD_BANKS[selectedTheme].prepositions.includes(word)) return 'preposition'
    return 'other'
  }

  const getWordTypeColor = (type: string) => {
    switch (type) {
      case 'noun': return 'bg-blue-100 text-blue-800'
      case 'adjective': return 'bg-green-100 text-green-800'
      case 'verb': return 'bg-purple-100 text-purple-800'
      case 'preposition': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-4xl font-serif font-bold text-foreground">Verse Builder</h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Drag words to create beautiful poetic lines!
              </p>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {gameState === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-center">Choose a Theme</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {THEMES.map((theme) => (
                        <Button
                          key={theme}
                          variant={selectedTheme === theme ? 'default' : 'outline'}
                          className="w-full justify-start capitalize"
                          onClick={() => setSelectedTheme(theme)}
                        >
                          {theme}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={startGame} className="w-full" size="lg">
                      <Zap className="h-4 w-4 mr-2" />
                      Start Building
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Game Stats */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </Badge>
                    <Badge variant="outline">
                      Lines: {lines.length}
                    </Badge>
                    <Badge variant="outline">
                      Words: {selectedWords.length}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={shuffleWords}>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Shuffle
                    </Button>
                    <Button variant="outline" onClick={() => setGameState('menu')}>
                      <Home className="h-4 w-4 mr-2" />
                      Menu
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Words */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Available Words</span>
                        <Badge variant="secondary" className="capitalize">
                          {selectedTheme}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                        {availableWords
                          .filter(word => !selectedWords.includes(word))
                          .map((word) => {
                            const type = getWordType(word)
                            return (
                              <Button
                                key={word}
                                variant="outline"
                                size="sm"
                                onClick={() => selectWord(word)}
                                className="justify-start text-xs"
                              >
                                <Badge 
                                  className={`mr-2 ${getWordTypeColor(type)}`}
                                  variant="secondary"
                                >
                                  {type.charAt(0).toUpperCase()}
                                </Badge>
                                {word}
                              </Button>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Line */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Line</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="min-h-[200px] p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        {currentLine.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            Click words to build your line
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentLine.map((word, index) => (
                              <Badge
                                key={`${word}-${index}`}
                                variant="secondary"
                                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeWordFromLine(index)}
                              >
                                {word} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          onClick={finishLine}
                          disabled={currentLine.length === 0}
                          className="flex-1"
                        >
                          Finish Line
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setCurrentLine([])
                            setSelectedWords([])
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Completed Lines */}
                {lines.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Poem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lines.map((line, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {line.map((word, wordIndex) => (
                                <Badge key={wordIndex} variant="outline">
                                  {word}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Finish Game Button */}
                <div className="text-center">
                  <Button onClick={endGame} size="lg">
                    <Trophy className="h-4 w-4 mr-2" />
                    Finish Poem
                  </Button>
                </div>
              </motion.div>
            )}

            {gameState === 'finished' && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-foreground mb-2">Poem Complete!</h2>
                      <div className="text-3xl font-bold text-primary mb-2">{score} points</div>
                      <p className="text-muted-foreground">
                        You created {lines.length} lines using {selectedWords.length} words
                      </p>
                    </div>

                    {/* Display the completed poem */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-center">Your Creation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-center">
                          {lines.map((line, index) => (
                            <div key={index} className="text-lg">
                              {line.join(' ')}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-2">
                      <Button onClick={startGame} className="w-full">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Create Another
                      </Button>
                      <Button variant="outline" onClick={() => setGameState('menu')} className="w-full">
                        <Home className="h-4 w-4 mr-2" />
                        Back to Menu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}