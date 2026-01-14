
// Removed Google GenAI dependency completely.
// Now using local logic for commentary.

const COMMENTARY_TEMPLATES = {
  start: [
    "比赛开始！咱们的数学小天才 VS 铁头机器人！",
    "战斗打响！看看谁的脑袋转得快！",
    "准备好了吗？用你的数学知识击倒它！",
    "各就各位！数学擂台赛正式开始！"
  ],
  win: [
    "胜利！你就是全宇宙最聪明的拳王！",
    "赢啦！机器人哭着回家找妈妈了！",
    "太棒了！金腰带属于你！",
    "完胜！你的计算速度比火箭还快！"
  ],
  lose: [
    "惜败！机器人这次只是侥幸，再来一局！",
    "没关系，失败是成功之母，下把赢回来！",
    "别灰心，回去练练乘法表，回来吊打它！",
    "哎呀，只差一点点，下次一定能赢！"
  ],
  correct: [
    "漂亮！机器人被打得冒烟了！",
    "好球！这一拳有泰森的风范！",
    "太强了！机器人根本防不住！",
    "神算子！这一拳打得精准无比！",
    "机器人被打懵了，继续保持！",
    "完美的答案！完美的出拳！"
  ],
  wrong: [
    "哎呀！这拳打空了，下次瞄准点！",
    "别灰心，机器人只是运气好！",
    "稳住！深呼吸，下一题必中！",
    "不要慌，机器人正在得意忘形呢！",
    "失误失误，下次一定能算对！",
    "注意审题，再来一次！"
  ],
  critical: [
      "机器人快散架了，胜利就在眼前！",
      "再加把劲，机器人已经站不稳了！",
      "最后一击！给它点颜色看看！"
  ],
  playerCritical: [
      "哎哟！你的血量不多了，要小心啊！",
      "挺住！坚持就是胜利！",
      "绝地反击的时候到了！"
  ]
};

const getRandomCommentary = (list: string[]) => {
   return list[Math.floor(Math.random() * list.length)];
}

export const getFightCommentary = async (
  playerHp: number, 
  opponentHp: number, 
  lastAction: 'correct' | 'wrong' | 'start' | 'win' | 'lose'
): Promise<string> => {
  
  // Simple "Battle Analysis" Logic
  
  if (lastAction === 'correct') {
      if (opponentHp < 5) {
          return getRandomCommentary(COMMENTARY_TEMPLATES.critical);
      }
      return getRandomCommentary(COMMENTARY_TEMPLATES.correct);
  }
  
  if (lastAction === 'wrong') {
      if (playerHp < 5) {
          return getRandomCommentary(COMMENTARY_TEMPLATES.playerCritical);
      }
      return getRandomCommentary(COMMENTARY_TEMPLATES.wrong);
  }
  
  // @ts-ignore
  const list = COMMENTARY_TEMPLATES[lastAction] || COMMENTARY_TEMPLATES.start;
  return getRandomCommentary(list);
};
