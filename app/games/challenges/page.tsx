// app/games/challenges/page.tsx
'use client';

import { useState } from 'react';

export default function ChallengesPage() {
  const [currentChallenge, setCurrentChallenge] = useState({
    title: "Nature's Beauty",
    description: "Write a poem inspired by nature",
    theme: "Nature",
    wordLimit: 100,
    deadline: "2024-12-31"
  });

  const [userSubmission, setUserSubmission] = useState('');

  const challenges = [
    {
      title: "Nature's Beauty",
      theme: "Nature",
      difficulty: "Easy"
    },
    {
      title: "Urban Life", 
      theme: "City",
      difficulty: "Medium"
    },
    {
      title: "Lost Love",
      theme: "Romance", 
      difficulty: "Hard"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Daily Challenges</h1>

        {/* Current Challenge */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="bg-yellow-100 inline-block px-4 py-1 rounded-full text-sm font-bold mb-4">
            Today's Challenge
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{currentChallenge.title}</h2>
          <p className="text-gray-700 mb-4">{currentChallenge.description}</p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-bold text-sm">Theme</div>
              <div>{currentChallenge.theme}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-bold text-sm">Word Limit</div>
              <div>{currentChallenge.wordLimit} words</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-bold text-sm">Deadline</div>
              <div>{currentChallenge.deadline}</div>
            </div>
          </div>

          <textarea
            value={userSubmission}
            onChange={(e) => setUserSubmission(e.target.value)}
            placeholder="Write your poem here..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          
          <button className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-medium">
            Submit Your Poem
          </button>
        </div>

        {/* Other Challenges */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Upcoming Challenges</h2>
          <div className="grid gap-4">
            {challenges.map((challenge, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-bold">{challenge.title}</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Theme: {challenge.theme}</span>
                  <span>Difficulty: {challenge.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
          }
