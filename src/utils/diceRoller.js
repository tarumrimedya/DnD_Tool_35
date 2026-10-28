// D&D 3.5 Dice Roller Utility

let rollLog = [
  { id: 1, label: 'Initiative Check', dice: '1d20+2', roll: 18, modifier: 2, total: 20, isNat20: false, isNat1: false, time: 'Just now' }
];

export function rollDice(sides, modifier = 0, label = 'Custom Roll') {
  const roll = Math.floor(Math.random() * sides) + 1;
  const total = roll + modifier;
  const isNat20 = sides === 20 && roll === 20;
  const isNat1 = sides === 20 && roll === 1;

  const entry = {
    id: Date.now(),
    label,
    dice: `1d${sides}${modifier >= 0 ? '+' + modifier : modifier}`,
    roll,
    modifier,
    total,
    isNat20,
    isNat1,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  rollLog.unshift(entry);
  if (rollLog.length > 25) rollLog.pop();

  return entry;
}

export function getRollLog() {
  return rollLog;
}

export function clearRollLog() {
  rollLog = [];
}
