// app/games/madlibs/page.tsx
'use client'; // This makes it a client component

import { useState } from 'react';

export default function MadLibsGame() {
  const [userInputs, setUserInputs] = useState({
    adjective: '',
    noun: '',
    verb: '',
    emotion: '',
    color: ''
  });
  const [generatedPoem, setGeneratedPoem] = useState('');

  const templates = [
    {
      title: "Romantic Poem",
      template: "Roses are {color}, violets are blue, you're so {adjective}, I {verb} you!"
    },
    {
      title: "Nature Poem", 
      template: "The {adjective} {noun} dances in the light, filling me with {emotion} delight"
    },
    {
      title: "Mystery Poem",
      template: "In the {adjective} night, a {noun} did {verb}, with {emotion} and {color} might"
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);

  const generatePoem = () => {
    let poem = selectedTemplate.template;
    
    // Replace placeholders with user inputs
    poem = poem.replace('{adjective}', userInputs.adjective);
    poem = poem.replace('{noun}', userInputs.noun);
    poem = poem.replace('{verb}', userInputs.verb);
    poem = poem.replace('{emotion}', userInputs.emotion);
    poem = poem.replace('{color}', userInputs.color);
    
    setGeneratedPoem(poem);
  };

  if (generatedPoem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">Your Generated Poem! 🎉</h1>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
            <p className="text-xl italic text-center leading-relaxed">"{generatedPoem}"</p>
          </div>

          <div className="text-center space-y-4">
            <button 
              onClick={() => setGeneratedPoem('')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium"
            >
              Create Another Poem
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-medium ml-4">
              Save to My Poems
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-2">Mad Libs Poetry</h1>
        <p className="text-xl text-center text-gray-600 mb-8">Fill in the words and watch the magic happen!</p>

        {/* Template Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Choose a Poem Template:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 rounded-lg border-2 text-left ${
                  selectedTemplate.title === template.title 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <h3 className="font-bold">{template.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{template.template}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Word Inputs */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Fill in the Blanks:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InputField 
              label="Adjective (describing word)" 
              value={userInputs.adjective}
              onChange={(value) => setUserInputs({...userInputs, adjective: value})}
              placeholder="e.g., beautiful, mysterious"
            />
            <InputField 
              label="Noun (person, place, thing)" 
              value={userInputs.noun}
              onChange={(value) => setUserInputs({...userInputs, noun: value})}
              placeholder="e.g., moon, ocean, dream"
            />
            <InputField 
              label="Verb (action word)" 
              value={userInputs.verb}
              onChange={(value) => setUserInputs({...userInputs, verb: value})}
              placeholder="e.g., dance, whisper, shine"
            />
            <InputField 
              label="Emotion" 
              value={userInputs.emotion}
              onChange={(value) => setUserInputs({...userInputs, emotion: value})}
              placeholder="e.g., joy, sorrow, excitement"
            />
            <InputField 
              label="Color" 
              value={userInputs.color}
              onChange={(value) => setUserInputs({...userInputs, color: value})}
              placeholder="e.g., crimson, azure, golden"
            />
          </div>

          <button 
            onClick={generatePoem}
            disabled={!userInputs.adjective || !userInputs.noun}
            className="w-full bg-green-600 text-white py-4 rounded-lg text-xl font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate My Poem! ✨
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
