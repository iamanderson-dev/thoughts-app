'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase'; // ✅ Make sure this path is correct
import { supabase } from '@/lib/supabase/client';

const ProfilePage = () => {
  


  // Types
  type User = Database['public']['Tables']['users']['Row'];
  type Thought = Database['public']['Tables']['thoughts']['Row'];

  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);

  const [profile, setProfile] = useState<User | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [newThought, setNewThought] = useState('');

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
      if (!sessionData?.session) {
        console.warn('No session found. User may not be logged in.');
        return;
      }
  
      const user = sessionData.session.user;
  
      if (!user?.email) {
        console.warn('User email missing.');
        return;
      }
  
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
  
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }
  
      setUser({ id: user.id, email: user.email });
      setProfile(profileData);
      fetchThoughts(profileData.id);
    } catch (err) {
      console.error('Unexpected error in getUser():', err);
    }
  };
  
  

  const fetchThoughts = async (userId: string) => {
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching thoughts:', error);
    else setThoughts(data || []);
  };

  const handlePostThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThought.trim() || !user) return;

    const { error } = await supabase.from('thoughts').insert([
      {
        user_id: user.id,
        content: newThought.trim(),
      },
    ]);

    if (error) {
      console.error('Error posting thought:', error);
    } else {
      setNewThought('');
      fetchThoughts(user.id);
    }
  };

  if (!user || !profile) return <p>Loading profile...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <div className="mb-6 p-4 border rounded bg-gray-50">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <form onSubmit={handlePostThought} className="mb-6">
        <textarea
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="What's on your mind?"
          rows={3}
        />
        <button
          type="submit"
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Post Thought
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-3">Your Thoughts</h2>
      {thoughts.length === 0 ? (
        <p className="text-gray-500">No thoughts posted yet.</p>
      ) : (
        thoughts.map((thought) => (
          <div
            key={thought.id}
            className="mb-4 border rounded p-4 bg-white shadow-sm"
          >
            <p>{thought.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              Posted on {new Date(thought.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfilePage;
