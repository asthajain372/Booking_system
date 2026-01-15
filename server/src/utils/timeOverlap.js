// utils/timeOverlap.js
function isOverlap(start1, end1, start2, end2) {
  // Convert times to minutes for easier comparison
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  // Check for overlap
  return (
    (start1Min < end2Min && end1Min > start2Min) ||
    (start2Min < end1Min && end2Min > start1Min)
  );
}

module.exports = isOverlap;