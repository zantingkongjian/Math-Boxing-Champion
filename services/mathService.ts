import { Difficulty, MathType, Problem } from '../types';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateProblem = (difficulty: Difficulty): Problem => {
  const isMultiplication = Math.random() > 0.4; // 60% chance multiplication, 40% division
  const maxNum = difficulty === Difficulty.EASY ? 5 : 9;
  const minNum = 1;

  let num1 = getRandomInt(minNum, maxNum);
  let num2 = getRandomInt(minNum, maxNum);
  
  // Ensure we don't just get 1x1 all the time, bias towards slightly harder numbers for "Hard"
  if (difficulty === Difficulty.HARD && Math.random() > 0.3) {
      num1 = getRandomInt(3, 9);
      num2 = getRandomInt(3, 9);
  }

  let question = '';
  let answer = 0;
  let type = MathType.MULTIPLICATION;

  if (isMultiplication) {
    type = MathType.MULTIPLICATION;
    answer = num1 * num2;
    question = `${num1} × ${num2} = ?`;
  } else {
    // Generate division from multiplication to ensure integers
    type = MathType.DIVISION;
    const product = num1 * num2;
    
    // Prevent division by 1 being too frequent if possible, swap to divide by the larger number
    // e.g. 5 * 1 = 5. Question: 5 / 1 = 5.
    // Swap: Question: 5 / 5 = 1.
    if (num1 === 1 && num2 !== 1) {
        const temp = num1;
        num1 = num2;
        num2 = temp;
    }
    question = `${product} ÷ ${num1} = ?`;
    answer = num2;
  }

  // Generate options
  const options = new Set<number>();
  options.add(answer);

  while (options.size < 4) {
    let wrongAnswer = 0;
    const offset = getRandomInt(-5, 5);
    wrongAnswer = answer + offset;
    
    // Safety check: wrong answers must be positive integers for this grade level
    // If the answer is small (e.g. 2), offset -5 gives -3.
    // If we land on 0 or negative, just pick a random number in a reasonable range (1-20 or near answer)
    if (wrongAnswer <= 0) {
        wrongAnswer = getRandomInt(1, Math.max(10, answer + 5));
    }
    
    // Add if unique
    if (wrongAnswer !== answer) {
      options.add(wrongAnswer);
    }
  }

  return {
    id: Math.random().toString(36).substring(7),
    question,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5),
    type
  };
};