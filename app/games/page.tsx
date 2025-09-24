
// app/games/page.tsx
import Link from 'next/link';

export default function GamesPage() {
  const games = [
    {
      id: 'madlibs',
      title: 'Mad Libs Poetry',
      description: 'Fill in the blanks to create fun poems!',
      icon: '🧩',
      color: 'bg-purple-100'
    },
    {
      id: 'challenges', 
      title: 'Daily Challenges',
      description: 'New writing prompts every day',
      icon: '🏆',
      color: 'bg-yellow-100'
    },
    {
      id: 'collaborative',
      title: 'Collaborative Poems', 
      description: 'Write poems together with others',
      icon: '👥',
      color: 'bg-blue-100'
    },
    {
      id: 'rhyme-battle',
      title: 'Rhyme Battle',
      description: 'Compete in poetry contests',
      icon: '⚔️',
      color: 'bg-red-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Poetry Games</h1>
          <p className="text-xl text-gray-600">Have fun while improving your writing skills!</p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
              <div className={`${game.color} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full cursor-pointer`}>
                <div className="text-4xl mb-4">{game.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{game.title}</h2>
                <p className="text-gray-700">{game.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* User Stats */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-6">Your Game Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Games Played" value="0" />
            <StatCard label="Poems Created" value="0" />
            <StatCard label="Challenges Won" value="0" />
            <StatCard label="Collaborations" value="0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className="text-3xl font-bold text-indigo-600">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
        }
