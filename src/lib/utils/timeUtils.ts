export const adjustTime = (
  timeString: string,
  delayMinutes: number
): string => {
  const [hours, minutes] = timeString.split(':').map(Number);

  let totalMinutes = hours * 60 + minutes + delayMinutes;

  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440; // 1440 = 24時間 * 60分

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(
    2,
    '0'
  )}`;
};
