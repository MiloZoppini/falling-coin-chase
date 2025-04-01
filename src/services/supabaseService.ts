
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock implementation when credentials are missing
const isMissingCredentials = !supabaseUrl || !supabaseKey;

// Create client (use mock if credentials are missing)
const supabase = isMissingCredentials 
  ? createMockSupabaseClient() 
  : createClient(supabaseUrl, supabaseKey);

// Mock implementation for local development
function createMockSupabaseClient() {
  console.warn('Supabase credentials not found. Using mock implementation.');
  
  // Mock data for high scores
  const mockHighScores = [
    { id: 1, playerName: 'Player1', score: 2500, created_at: new Date().toISOString() },
    { id: 2, playerName: 'Player2', score: 2000, created_at: new Date().toISOString() },
    { id: 3, playerName: 'Player3', score: 1800, created_at: new Date().toISOString() },
    { id: 4, playerName: 'Player4', score: 1500, created_at: new Date().toISOString() },
    { id: 5, playerName: 'Player5', score: 1200, created_at: new Date().toISOString() }
  ];
  
  // Return a mock client with the same interface
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            data: mockHighScores,
            error: null
          })
        })
      }),
      insert: () => ({
        data: { id: Date.now() },
        error: null
      })
    })
  } as any;
}

export interface HighScore {
  id?: number;
  playerName: string;
  score: number;
  created_at?: string;
}

export const getHighScores = async (): Promise<HighScore[]> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching high scores:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch high scores:', error);
    return [];
  }
};

export const saveHighScore = async (playerName: string, score: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('high_scores')
      .insert([{ playerName, score }]);
    
    if (error) {
      console.error('Error saving high score:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save high score:', error);
    return false;
  }
};
