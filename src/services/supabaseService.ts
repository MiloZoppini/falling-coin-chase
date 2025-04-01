
import { supabase } from '@/integrations/supabase/client';

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
    
    // Transform the data to match our HighScore interface
    // This handles the case where Supabase returns playername (lowercase) but our interface uses playerName
    return (data || []).map(item => ({
      id: item.id,
      playerName: item.playername, // Map playername to playerName
      score: item.score,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch high scores:', error);
    return [];
  }
};

export const saveHighScore = async (playerName: string, score: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('high_scores')
      .insert([{ playername: playerName, score }]); // Use playername (lowercase) to match DB column
    
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
