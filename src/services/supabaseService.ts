
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
