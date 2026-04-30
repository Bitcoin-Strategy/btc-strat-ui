export interface VestingPosition {
  id: string;
  series: string;
  total: number;
  claimed: number;
  start: string;
  end: string;
  progress: number;
}
