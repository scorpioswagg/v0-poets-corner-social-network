"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Target, 
  RotateCcw, 
  Home, 
  Trophy, 
  Clock, 
  Zap,
  CheckCircle,
  XCircle
} from "lucide-react"

// Poetic words and phrases for the game
const POETIC_WORDS = [
  "serenity", "whisper", "moonlight", "cascade", "ethereal", "luminous",
  "melancholy", "tranquil", "resonance", "crimson", "velvet", "crystal",
  "dancing shadows", "silent tears", "golden hour", "midnight dreams",
  "autumn leaves", "winter's embrace", "spring's awakening", "summer's kiss"
]

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

export default function HangmanGame() {
  const [user, setUser] = useState<any>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu')
  const [currentWord, setCurrentWord] = useState("")
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [gameId, setGameId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const MAX_WRONG_GUESSES = 6

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
      endGame(false)
    }
    return () => clearInterval(interval)
  }, [gameState, timeLeft])

  const startGame = async () => {
    const word = POETIC_WORDS[Math.floor(Math.random() * POETIC_WORDS.length)].toUpperCase()
    setCurrentWord(word)
    setGuessedLetters([])
    setWrongGuesses(0)
    setTimeLeft(300)
    setGameStartTime(Date.now())
    setGameState('playing')

    // Create game record
    try {
      const { data: gameData } = await supabase
        .from("games")
        .select("id")
        .eq("game_type", "hangman")
        .single()

      if (gameData) {
        setGameId(gameData.id)
      }
    } catch (error) {
      console.error("Error creating game record:", error)
    }
  }

  const endGame = async (won: boolean) => {
    setGameState('finished')
    
    if (won) {
      const timeBonus = Math.max(0, timeLeft * 10)
      const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2
      const finalScore = Math.round((1000 + timeBonus) * difficultyMultiplier)
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
                word: currentWord,
                wrong_guesses: wrongGuesses,
                difficulty: difficulty
              }
            })
        } catch (error) {
          console.error("Error saving score:", error)
        }
      }
    }
  }

  const guessLetter = (letter: string) => {
    if (gameState !== 'playing' || guessedLetters.includes(letter)) return

    const newGuessedLetters = [...guessedLetters, letter]
    setGuessedLetters(newGuessedLetters)

    if (!currentWord.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1
      setWrongGuesses(newWrongGuesses)
      
      if (newWrongGuesses >= MAX_WRONG_GUESSES) {
        endGame(false)
      }
    } else {
      // Check if word is complete
      const isComplete = currentWord.split('').every(char => 
        char === ' ' || newGuessedLetters.includes(char)
      )
      if (isComplete) {
        endGame(true)
      }
    }
  }

  const getDisplayWord = () => {
    return currentWord.split('').map(char => 
      char === ' ' ? ' ' : guessedLetters.includes(char) ? char : '_'
    ).join(' ')
  }

  const getHangmanImage = () => {
    const stages = [
      "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========="
    ]
    return stages[wrongGuesses]
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-4xl font-serif font-bold text-foreground">Poetic Hangman</h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Guess the hidden poetic word or phrase before time runs out!
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
                    <CardTitle className="text-center">Choose Difficulty</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        variant={difficulty === 'easy' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setDifficulty('easy')}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Easy - 4-6 letters
                      </Button>
                      <Button
                        variant={difficulty === 'medium' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setDifficulty('medium')}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Medium - 7-10 letters
                      </Button>
                      <Button
                        variant={difficulty === 'hard' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setDifficulty('hard')}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Hard - 11+ letters
                      </Button>
                    </div>
                    <Button onClick={startGame} className="w-full" size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
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
                className="space-y-8"
              >
                {/* Game Stats */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </Badge>
                    <Badge variant="outline">
                      Wrong: {wrongGuesses}/{MAX_WRONG_GUESSES}
                    </Badge>
                  </div>
                  <Button variant="outline" onClick={() => setGameState('menu')}>
                    <Home className="h-4 w-4 mr-2" />
                    Menu
                  </Button>
                </div>

                {/* Hangman Display */}
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <pre className="text-sm font-mono text-muted-foreground mb-6">
                        {getHangmanImage()}
                      </pre>
                      <div className="text-4xl font-bold tracking-widest mb-6">
                        {getDisplayWord()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentWord.length} letters
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alphabet */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Choose a Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {ALPHABET.split('').map(letter => (
                        <Button
                          key={letter}
                          variant={guessedLetters.includes(letter) ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => guessLetter(letter)}
                          disabled={guessedLetters.includes(letter)}
                          className={`${
                            guessedLetters.includes(letter) 
                              ? currentWord.includes(letter) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                              : ''
                          }`}
                        >
                          {letter}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-8 text-center">
                    {score > 0 ? (
                      <div>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Congratulations!</h2>
                        <p className="text-muted-foreground mb-4">You guessed the word!</p>
                        <div className="text-3xl font-bold text-primary mb-2">{score} points</div>
                        <p className="text-sm text-muted-foreground mb-6">
                          The word was: <span className="font-bold">{currentWord}</span>
                        </p>
                      </div>
                    ) : (
                      <div>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Game Over</h2>
                        <p className="text-muted-foreground mb-4">Better luck next time!</p>
                        <p className="text-sm text-muted-foreground mb-6">
                          The word was: <span className="font-bold">{currentWord}</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Button onClick={startGame} className="w-full">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Play Again
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