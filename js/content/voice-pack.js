// Голосовой пакет (Higgsfield Seed Audio + локальный Qwen3-TTS). Собран audio/build_pack.py из audio/lines.json.
window.RL = window.RL || {};
RL.voicePack = {
 "lines": {
  "это городок почему здесь в каждом доме живет своя загадка куда пойдем сегодня": {
   "file": "audio/vo/g_map.mp3",
   "who": "narrator",
   "id": "g_map",
   "gain": 0.55
  },
  "этот домик пока закрыт откроем его в следующий раз": {
   "file": "audio/vo/g_locked.mp3",
   "who": "narrator",
   "id": "g_locked",
   "gain": 0.61
  },
  "ура я была права": {
   "file": "audio/vo/g_cheer_asya.mp3",
   "who": "asya",
   "id": "g_cheer_asya",
   "gain": 0.67
  },
  "ура я угадал": {
   "file": "audio/vo/g_cheer_tim.mp3",
   "who": "tim",
   "id": "g_cheer_tim",
   "gain": 0.5
  },
  "дом тепла наступила зима и на замерзшем озере совсем озяб наш робик": {
   "file": "audio/vo/h_narr.mp3",
   "who": "narrator",
   "id": "h_narr",
   "gain": 0.57
  },
  "брр я замерз где бы мне погреться": {
   "file": "audio/vo/h_intro.mp3",
   "who": "robik",
   "id": "h_intro",
   "fx": "robotC",
   "gain": 0.71
  },
  "ася и тим спорят а вы как думаете": {
   "file": "audio/vo/h_guess.mp3",
   "who": "robik",
   "id": "h_guess",
   "fx": "robotC",
   "gain": 0.71
  },
  "погрейся в ладошках они теплые": {
   "file": "audio/vo/h_asya.mp3",
   "who": "asya",
   "id": "h_asya",
   "gain": 0.46
  },
  "лучше в воде стакан стоял на солнце": {
   "file": "audio/vo/h_tim.mp3",
   "who": "tim",
   "id": "h_tim",
   "gain": 0.63
  },
  "возьми меня в ладошки и подержи": {
   "file": "audio/vo/h_c_hand.mp3",
   "who": "robik",
   "id": "h_c_hand",
   "fx": "robotC",
   "gain": 0.71
  },
  "а теперь опусти зонд в стакан с водой": {
   "file": "audio/vo/h_c_water.mp3",
   "who": "robik",
   "id": "h_c_water",
   "fx": "robotC",
   "gain": 0.71
  },
  "ой как тепло": {
   "file": "audio/vo/h_r_up.mp3",
   "who": "robik",
   "id": "h_r_up",
   "fx": "robotC",
   "gain": 0.71
  },
  "ой холодно": {
   "file": "audio/vo/h_r_down.mp3",
   "who": "robik",
   "id": "h_r_down",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил ладошка": {
   "file": "audio/vo/h_rec_hand.mp3",
   "who": "robik",
   "id": "h_rec_hand",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил вода": {
   "file": "audio/vo/h_rec_water.mp3",
   "who": "robik",
   "id": "h_rec_water",
   "fx": "robotC",
   "gain": 0.7
  },
  "права ася ладошки теплее а тим молодец что предложил проверить": {
   "file": "audio/vo/h_win_hand.mp3",
   "who": "robik",
   "id": "h_win_hand",
   "fx": "robotC",
   "gain": 0.72
  },
  "прав тим вода на солнце нагрелась сильнее ладошек вот это открытие": {
   "file": "audio/vo/h_win_water.mp3",
   "who": "robik",
   "id": "h_win_water",
   "fx": "robotC",
   "gain": 0.71
  },
  "одинаково вот это открытие правы оба": {
   "file": "audio/vo/h_tie.mp3",
   "who": "robik",
   "id": "h_tie",
   "fx": "robotC",
   "gain": 0.71
  },
  "помогите мне растопить лед грейте меня ладошками по очереди": {
   "file": "audio/vo/h_game.mp3",
   "who": "robik",
   "id": "h_game",
   "fx": "robotC",
   "gain": 0.7
  },
  "ура льдинка растаяла передайте меня следующему": {
   "file": "audio/vo/h_g_melt.mp3",
   "who": "robik",
   "id": "h_g_melt",
   "fx": "robotC",
   "gain": 0.71
  },
  "тур второй грейте меня": {
   "file": "audio/vo/h_g_round2.mp3",
   "who": "robik",
   "id": "h_g_round2",
   "fx": "robotC",
   "gain": 0.72
  },
  "тур третий грейте меня": {
   "file": "audio/vo/h_g_round3.mp3",
   "who": "robik",
   "id": "h_g_round3",
   "fx": "robotC",
   "gain": 0.71
  },
  "ура весь лед растаял спасибо мне тепло": {
   "file": "audio/vo/h_g_done.mp3",
   "who": "robik",
   "id": "h_g_done",
   "fx": "robotC",
   "gain": 0.72
  },
  "мы узнали ладошки теплые и это можно измерить наклейка огонек в альбом группы": {
   "file": "audio/vo/h_sticker.mp3",
   "who": "robik",
   "id": "h_sticker",
   "fx": "robotC",
   "gain": 0.71
  },
  "башня звуков наступила ночь и в домике сов все сладко спят": {
   "file": "audio/vo/s_narr.mp3",
   "who": "narrator",
   "id": "s_narr",
   "gain": 0.64
  },
  "тсс в домике сов спит малыш а мне нужно пройти мимо за печеньем как сделать будильник потише": {
   "file": "audio/vo/s_intro.mp3",
   "who": "robik",
   "id": "s_intro",
   "fx": "robotC",
   "gain": 0.73
  },
  "чем накрыть будильник чтобы стало тише всего": {
   "file": "audio/vo/s_guess.mp3",
   "who": "robik",
   "id": "s_guess",
   "fx": "robotC",
   "gain": 0.72
  },
  "шарф толстый значит лучше": {
   "file": "audio/vo/s_tim.mp3",
   "who": "tim",
   "id": "s_tim",
   "gain": 0.72
  },
  "пупырка она же мягкая": {
   "file": "audio/vo/s_asya.mp3",
   "who": "asya",
   "id": "s_asya",
   "gain": 0.71
  },
  "а может газета": {
   "file": "audio/vo/s_paper.mp3",
   "who": "robik",
   "id": "s_paper",
   "fx": "robotC",
   "gain": 0.71
  },
  "сначала послушаем открытый будильник": {
   "file": "audio/vo/s_c_open.mp3",
   "who": "robik",
   "id": "s_c_open",
   "fx": "robotC",
   "gain": 0.71
  },
  "накройте коробку шарфом держите меня на одном месте": {
   "file": "audio/vo/s_c_scarf.mp3",
   "who": "robik",
   "id": "s_c_scarf",
   "fx": "robotC",
   "gain": 0.71
  },
  "теперь накройте пупырчатой пленкой": {
   "file": "audio/vo/s_c_bubble.mp3",
   "who": "robik",
   "id": "s_c_bubble",
   "fx": "robotC",
   "gain": 0.71
  },
  "а теперь газетой": {
   "file": "audio/vo/s_c_paper.mp3",
   "who": "robik",
   "id": "s_c_paper",
   "fx": "robotC",
   "gain": 0.71
  },
  "ой как громко": {
   "file": "audio/vo/s_r_loud.mp3",
   "who": "robik",
   "id": "s_r_loud",
   "fx": "robotC",
   "gain": 0.7
  },
  "слышу но потише": {
   "file": "audio/vo/s_r_mid.mp3",
   "who": "robik",
   "id": "s_r_mid",
   "fx": "robotC",
   "gain": 0.7
  },
  "тихо тихо": {
   "file": "audio/vo/s_r_quiet.mp3",
   "who": "robik",
   "id": "s_r_quiet",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил без всего": {
   "file": "audio/vo/s_rec_open.mp3",
   "who": "robik",
   "id": "s_rec_open",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил шарф": {
   "file": "audio/vo/s_rec_scarf.mp3",
   "who": "robik",
   "id": "s_rec_scarf",
   "fx": "robotC",
   "gain": 0.66
  },
  "запомнил пленка": {
   "file": "audio/vo/s_rec_bubble.mp3",
   "who": "robik",
   "id": "s_rec_bubble",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил газета": {
   "file": "audio/vo/s_rec_paper.mp3",
   "who": "robik",
   "id": "s_rec_paper",
   "fx": "robotC",
   "gain": 0.71
  },
  "тише всего с шарфом прав тим а ася молодец что спорила так и узнали": {
   "file": "audio/vo/s_win_scarf.mp3",
   "who": "robik",
   "id": "s_win_scarf",
   "fx": "robotC",
   "gain": 0.71
  },
  "тише всего с пленкой права ася вот это открытие": {
   "file": "audio/vo/s_win_bubble.mp3",
   "who": "robik",
   "id": "s_win_bubble",
   "fx": "robotC",
   "gain": 0.71
  },
  "тише всего с газетой никто не угадал вот это открытие": {
   "file": "audio/vo/s_win_paper.mp3",
   "who": "robik",
   "id": "s_win_paper",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково значит оба материала глушат звук хорошо": {
   "file": "audio/vo/s_tie.mp3",
   "who": "robik",
   "id": "s_tie",
   "fx": "robotC",
   "gain": 0.7
  },
  "помогите мне дойти до печенья пока тихо я иду шумно совенок ворочается": {
   "file": "audio/vo/s_game.mp3",
   "who": "robik",
   "id": "s_game",
   "fx": "robotC",
   "gain": 0.71
  },
  "ой совенок проснулся баю бай малыш давайте еще тише": {
   "file": "audio/vo/s_g_wake.mp3",
   "who": "robik",
   "id": "s_g_wake",
   "fx": "robotC",
   "gain": 0.71
  },
  "ура печенье совенок снова сладко спит": {
   "file": "audio/vo/s_g_done1.mp3",
   "who": "robik",
   "id": "s_g_done1",
   "fx": "robotC",
   "gain": 0.71
  },
  "ура печенье и никто не проснулся": {
   "file": "audio/vo/s_g_done0.mp3",
   "who": "robik",
   "id": "s_g_done0",
   "fx": "robotC",
   "gain": 0.71
  },
  "мы узнали мягкие и толстые вещи глушат звук наклейка колокольчик в альбом группы": {
   "file": "audio/vo/s_sticker.mp3",
   "who": "robik",
   "id": "s_sticker",
   "fx": "robotC",
   "gain": 0.71
  },
  "маяк света ночью на море опустился туман а маяк погас": {
   "file": "audio/vo/l_narr.mp3",
   "who": "narrator",
   "id": "l_narr",
   "gain": 0.63
  },
  "ой кораблик не видит берега надо зажечь маяк только чем закрыть фонарь от ветра чтобы свет прошел": {
   "file": "audio/vo/l_intro.mp3",
   "who": "robik",
   "id": "l_intro",
   "fx": "robotC",
   "gain": 0.71
  },
  "чем закрыть фонарь чтобы света прошло больше всего": {
   "file": "audio/vo/l_guess.mp3",
   "who": "robik",
   "id": "l_guess",
   "fx": "robotC",
   "gain": 0.71
  },
  "стекло оно же прозрачное": {
   "file": "audio/vo/l_asya.mp3",
   "who": "asya",
   "id": "l_asya",
   "gain": 0.84
  },
  "калька тонкая свет пройдет": {
   "file": "audio/vo/l_tim.mp3",
   "who": "tim",
   "id": "l_tim",
   "gain": 0.61
  },
  "а может картон": {
   "file": "audio/vo/l_card.mp3",
   "who": "robik",
   "id": "l_card",
   "fx": "robotC",
   "gain": 0.7
  },
  "сначала посветите фонариком прямо на меня": {
   "file": "audio/vo/l_c_open.mp3",
   "who": "robik",
   "id": "l_c_open",
   "fx": "robotC",
   "gain": 0.71
  },
  "поставьте цветное стекло между фонариком и мной": {
   "file": "audio/vo/l_c_glass.mp3",
   "who": "robik",
   "id": "l_c_glass",
   "fx": "robotC",
   "gain": 0.71
  },
  "теперь поставьте кальку": {
   "file": "audio/vo/l_c_paper.mp3",
   "who": "robik",
   "id": "l_c_paper",
   "fx": "robotC",
   "gain": 0.7
  },
  "а теперь картон": {
   "file": "audio/vo/l_c_card.mp3",
   "who": "robik",
   "id": "l_c_card",
   "fx": "robotC",
   "gain": 0.71
  },
  "ой как ярко": {
   "file": "audio/vo/l_r_bright.mp3",
   "who": "robik",
   "id": "l_r_bright",
   "fx": "robotC",
   "gain": 0.71
  },
  "свет пробивается": {
   "file": "audio/vo/l_r_mid.mp3",
   "who": "robik",
   "id": "l_r_mid",
   "fx": "robotC",
   "gain": 0.7
  },
  "темно темно": {
   "file": "audio/vo/l_r_dark.mp3",
   "who": "robik",
   "id": "l_r_dark",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил стекло": {
   "file": "audio/vo/l_rec_glass.mp3",
   "who": "robik",
   "id": "l_rec_glass",
   "fx": "robotC",
   "gain": 0.7
  },
  "запомнил калька": {
   "file": "audio/vo/l_rec_paper.mp3",
   "who": "robik",
   "id": "l_rec_paper",
   "fx": "robotC",
   "gain": 0.82
  },
  "запомнил картон": {
   "file": "audio/vo/l_rec_card.mp3",
   "who": "robik",
   "id": "l_rec_card",
   "fx": "robotC",
   "gain": 0.71
  },
  "больше всего света пропускает стекло права ася а тим молодец что спорил": {
   "file": "audio/vo/l_win_glass.mp3",
   "who": "robik",
   "id": "l_win_glass",
   "fx": "robotC",
   "gain": 0.71
  },
  "больше всего света пропускает калька прав тим вот это открытие": {
   "file": "audio/vo/l_win_paper.mp3",
   "who": "robik",
   "id": "l_win_paper",
   "fx": "robotC",
   "gain": 0.74
  },
  "картон пропустил больше всех вот это открытие давайте проверим еще раз": {
   "file": "audio/vo/l_win_card.mp3",
   "who": "robik",
   "id": "l_win_card",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково оба материала пропускают свет": {
   "file": "audio/vo/l_tie.mp3",
   "who": "robik",
   "id": "l_tie",
   "fx": "robotC",
   "gain": 0.71
  },
  "помогите кораблику доплыть до берега мигайте фонариком включили выключили каждая вспышка шаг кораблика": {
   "file": "audio/vo/l_game.mp3",
   "who": "robik",
   "id": "l_game",
   "fx": "robotC",
   "gain": 0.73
  },
  "ура кораблик в гавани маяк снова светит": {
   "file": "audio/vo/l_g_done.mp3",
   "who": "robik",
   "id": "l_g_done",
   "fx": "robotC",
   "gain": 0.7
  },
  "мы узнали прозрачные вещи пропускают свет а плотные нет наклейка лучик в альбом группы": {
   "file": "audio/vo/l_sticker.mp3",
   "who": "robik",
   "id": "l_sticker",
   "fx": "robotC",
   "gain": 0.71
  },
  "метеостанция уже много дней нет дождя и цветы в саду совсем завяли": {
   "file": "audio/vo/w_narr.mp3",
   "who": "narrator",
   "id": "w_narr",
   "gain": 0.59
  },
  "жарко цветам нужен дождик а дождь это вода в воздухе давайте найдем где она прячется": {
   "file": "audio/vo/w_intro.mp3",
   "who": "robik",
   "id": "w_intro",
   "fx": "robotC",
   "gain": 0.71
  },
  "где в воздухе больше всего невидимой воды": {
   "file": "audio/vo/w_guess.mp3",
   "who": "robik",
   "id": "w_guess",
   "fx": "robotC",
   "gain": 0.71
  },
  "у мокрой губки она же мокрая": {
   "file": "audio/vo/w_asya.mp3",
   "who": "asya",
   "id": "w_asya",
   "gain": 0.59
  },
  "в дыхании зимой оно как пар": {
   "file": "audio/vo/w_tim.mp3",
   "who": "tim",
   "id": "w_tim",
   "gain": 0.69
  },
  "а может у полотенца": {
   "file": "audio/vo/w_towel.mp3",
   "who": "robik",
   "id": "w_towel",
   "fx": "robotC",
   "gain": 0.7
  },
  "сначала послушаем обычный воздух": {
   "file": "audio/vo/w_c_air.mp3",
   "who": "robik",
   "id": "w_c_air",
   "fx": "robotC",
   "gain": 0.71
  },
  "поднесите меня к сухому полотенцу": {
   "file": "audio/vo/w_c_towel.mp3",
   "who": "robik",
   "id": "w_c_towel",
   "fx": "robotC",
   "gain": 0.71
  },
  "а теперь к мокрой губке": {
   "file": "audio/vo/w_c_sponge.mp3",
   "who": "robik",
   "id": "w_c_sponge",
   "fx": "robotC",
   "gain": 0.71
  },
  "подышите на меня ха а а": {
   "file": "audio/vo/w_c_breath.mp3",
   "who": "robik",
   "id": "w_c_breath",
   "fx": "robotC",
   "gain": 0.71
  },
  "ой сыро капельки": {
   "file": "audio/vo/w_r_wet.mp3",
   "who": "robik",
   "id": "w_r_wet",
   "fx": "robotC",
   "gain": 0.7
  },
  "чуть влажно": {
   "file": "audio/vo/w_r_mid.mp3",
   "who": "robik",
   "id": "w_r_mid",
   "fx": "robotC",
   "gain": 0.71
  },
  "сухо сухо": {
   "file": "audio/vo/w_r_dry.mp3",
   "who": "robik",
   "id": "w_r_dry",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил воздух": {
   "file": "audio/vo/w_rec_air.mp3",
   "who": "robik",
   "id": "w_rec_air",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил полотенце": {
   "file": "audio/vo/w_rec_towel.mp3",
   "who": "robik",
   "id": "w_rec_towel",
   "fx": "robotC",
   "gain": 0.7
  },
  "запомнил губка": {
   "file": "audio/vo/w_rec_sponge.mp3",
   "who": "robik",
   "id": "w_rec_sponge",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил дыхание": {
   "file": "audio/vo/w_rec_breath.mp3",
   "who": "robik",
   "id": "w_rec_breath",
   "fx": "robotC",
   "gain": 0.7
  },
  "больше всего воды в дыхании прав тим а ася молодец что спорила": {
   "file": "audio/vo/w_win_breath.mp3",
   "who": "robik",
   "id": "w_win_breath",
   "fx": "robotC",
   "gain": 0.71
  },
  "больше всего воды у мокрой губки права ася вот это открытие": {
   "file": "audio/vo/w_win_sponge.mp3",
   "who": "robik",
   "id": "w_win_sponge",
   "fx": "robotC",
   "gain": 0.71
  },
  "у сухого полотенца больше всех вот это открытие давайте проверим еще раз": {
   "file": "audio/vo/w_win_towel.mp3",
   "who": "robik",
   "id": "w_win_towel",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково вода прячется и там и там": {
   "file": "audio/vo/w_tie.mp3",
   "who": "robik",
   "id": "w_tie",
   "fx": "robotC",
   "gain": 0.7
  },
  "помогите вырастить тучку дышите на меня по очереди ха а а когда тучка вырастет польется дождик": {
   "file": "audio/vo/w_game.mp3",
   "who": "robik",
   "id": "w_game",
   "fx": "robotC",
   "gain": 0.71
  },
  "дождик цветок расцвел передайте меня следующему": {
   "file": "audio/vo/w_g_next.mp3",
   "who": "robik",
   "id": "w_g_next",
   "fx": "robotC",
   "gain": 0.71
  },
  "тур второй дышите на меня": {
   "file": "audio/vo/w_g_round2.mp3",
   "who": "robik",
   "id": "w_g_round2",
   "fx": "robotC",
   "gain": 0.7
  },
  "тур третий дышите на меня": {
   "file": "audio/vo/w_g_round3.mp3",
   "who": "robik",
   "id": "w_g_round3",
   "fx": "robotC",
   "gain": 0.7
  },
  "ура все цветы расцвели спасибо за дождик": {
   "file": "audio/vo/w_g_done.mp3",
   "who": "robik",
   "id": "w_g_done",
   "fx": "robotC",
   "gain": 0.71
  },
  "мы узнали вода прячется в воздухе а больше всего ее в нашем дыхании наклейка капелька в альбом группы": {
   "file": "audio/vo/w_sticker.mp3",
   "who": "robik",
   "id": "w_sticker",
   "fx": "robotC",
   "gain": 0.72
  },
  "дом тепла к робику пришел в гости котенок он замерз на улице и ищет где улечься": {
   "file": "audio/vo/heat2_narr.mp3",
   "who": "narrator",
   "id": "heat2_narr",
   "gain": 0.6
  },
  "давайте найдем котенку самое теплое место в комнате я буду градусником": {
   "file": "audio/vo/heat2_intro.mp3",
   "who": "robik",
   "id": "heat2_intro",
   "fx": "robotC",
   "gain": 0.71
  },
  "где в комнате теплее всего": {
   "file": "audio/vo/heat2_guess.mp3",
   "who": "robik",
   "id": "heat2_guess",
   "fx": "robotC",
   "gain": 0.71
  },
  "у окна там солнышко светит": {
   "file": "audio/vo/heat2_opt_window.mp3",
   "who": "asya",
   "id": "heat2_opt_window",
   "gain": 0.83
  },
  "у батареи она же греет": {
   "file": "audio/vo/heat2_opt_radiator.mp3",
   "who": "tim",
   "id": "heat2_opt_radiator",
   "gain": 0.51
  },
  "а может на полу на ковре": {
   "file": "audio/vo/heat2_opt_floor.mp3",
   "who": "robik",
   "id": "heat2_opt_floor",
   "fx": "robotC",
   "gain": 0.73
  },
  "сначала положите меня на стол это обычная комната": {
   "file": "audio/vo/heat2_c_table.mp3",
   "who": "robik",
   "id": "heat2_c_table",
   "fx": "robotC",
   "gain": 0.73
  },
  "запомнил стол": {
   "file": "audio/vo/heat2_m_table.mp3",
   "who": "robik",
   "id": "heat2_m_table",
   "fx": "robotC",
   "gain": 0.71
  },
  "теперь положите меня у окна на подоконник": {
   "file": "audio/vo/heat2_c_window.mp3",
   "who": "robik",
   "id": "heat2_c_window",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил окно": {
   "file": "audio/vo/heat2_m_window.mp3",
   "who": "robik",
   "id": "heat2_m_window",
   "fx": "robotC",
   "gain": 0.71
  },
  "а теперь рядом с батареей только саму батарею не трогайте": {
   "file": "audio/vo/heat2_c_radiator.mp3",
   "who": "robik",
   "id": "heat2_c_radiator",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил батарея": {
   "file": "audio/vo/heat2_m_radiator.mp3",
   "who": "robik",
   "id": "heat2_m_radiator",
   "fx": "robotC",
   "gain": 0.71
  },
  "и последнее место пол": {
   "file": "audio/vo/heat2_c_floor.mp3",
   "who": "robik",
   "id": "heat2_c_floor",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил пол": {
   "file": "audio/vo/heat2_m_floor.mp3",
   "who": "robik",
   "id": "heat2_m_floor",
   "fx": "robotC",
   "gain": 0.71
  },
  "теплее всего у батареи прав тим а ася молодец что спорила": {
   "file": "audio/vo/heat2_win_radiator.mp3",
   "who": "robik",
   "id": "heat2_win_radiator",
   "fx": "robotC",
   "gain": 0.71
  },
  "теплее всего у окна права ася солнышко греет даже зимой": {
   "file": "audio/vo/heat2_win_window.mp3",
   "who": "robik",
   "id": "heat2_win_window",
   "fx": "robotC",
   "gain": 0.71
  },
  "теплее всего на полу вот это открытие может там теплый пол": {
   "file": "audio/vo/heat2_win_floor.mp3",
   "who": "robik",
   "id": "heat2_win_floor",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково значит в комнате тепло везде": {
   "file": "audio/vo/heat2_tie.mp3",
   "who": "robik",
   "id": "heat2_tie",
   "fx": "robotC",
   "gain": 0.71
  },
  "котенок уснул а я замерз погрейте меня ладошками по очереди": {
   "file": "audio/vo/heat2_game.mp3",
   "who": "robik",
   "id": "heat2_game",
   "fx": "robotC",
   "gain": 0.7
  },
  "мы узнали в одной комнате бывает и тепло и прохладно а термометр показывает где наклейка огонек в альбом группы": {
   "file": "audio/vo/heat2_sticker.mp3",
   "who": "robik",
   "id": "heat2_sticker",
   "fx": "robotC",
   "gain": 0.71
  },
  "давайте найдем самое светлое место я умею мерить свет": {
   "file": "audio/vo/light2_intro.mp3",
   "who": "robik",
   "id": "light2_intro",
   "fx": "robotC",
   "gain": 0.71
  },
  "где в комнате светлее всего": {
   "file": "audio/vo/light2_guess.mp3",
   "who": "robik",
   "id": "light2_guess",
   "fx": "robotC",
   "gain": 0.7
  },
  "у окна там солнышко": {
   "file": "audio/vo/light2_opt_window.mp3",
   "who": "asya",
   "id": "light2_opt_window",
   "gain": 0.77
  },
  "под лампой она яркая": {
   "file": "audio/vo/light2_opt_lamp.mp3",
   "who": "tim",
   "id": "light2_opt_lamp",
   "gain": 0.67
  },
  "а может в углу": {
   "file": "audio/vo/light2_opt_corner.mp3",
   "who": "robik",
   "id": "light2_opt_corner",
   "fx": "robotC",
   "gain": 0.71
  },
  "положите меня на подоконник": {
   "file": "audio/vo/light2_c_window.mp3",
   "who": "robik",
   "id": "light2_c_window",
   "fx": "robotC",
   "gain": 0.71
  },
  "теперь под лампу": {
   "file": "audio/vo/light2_c_lamp.mp3",
   "who": "robik",
   "id": "light2_c_lamp",
   "fx": "robotC",
   "gain": 0.7
  },
  "запомнил лампа": {
   "file": "audio/vo/light2_m_lamp.mp3",
   "who": "robik",
   "id": "light2_m_lamp",
   "fx": "robotC",
   "gain": 0.71
  },
  "а теперь в угол комнаты": {
   "file": "audio/vo/light2_c_corner.mp3",
   "who": "robik",
   "id": "light2_c_corner",
   "fx": "robotC",
   "gain": 0.7
  },
  "запомнил угол": {
   "file": "audio/vo/light2_m_corner.mp3",
   "who": "robik",
   "id": "light2_m_corner",
   "fx": "robotC",
   "gain": 0.71
  },
  "и последнее спрячьте меня под стол": {
   "file": "audio/vo/light2_c_under.mp3",
   "who": "robik",
   "id": "light2_c_under",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил под столом": {
   "file": "audio/vo/light2_m_under.mp3",
   "who": "robik",
   "id": "light2_m_under",
   "fx": "robotC",
   "gain": 0.71
  },
  "светлее всего у окна права ася солнце ярче любой лампы": {
   "file": "audio/vo/light2_win_window.mp3",
   "who": "robik",
   "id": "light2_win_window",
   "fx": "robotC",
   "gain": 0.71
  },
  "светлее всего под лампой прав тим вот где читать книжку": {
   "file": "audio/vo/light2_win_lamp.mp3",
   "who": "robik",
   "id": "light2_win_lamp",
   "fx": "robotC",
   "gain": 0.73
  },
  "светлее всего в углу вот это открытие давайте проверим еще раз": {
   "file": "audio/vo/light2_win_corner.mp3",
   "who": "robik",
   "id": "light2_win_corner",
   "fx": "robotC",
   "gain": 0.71
  },
  "под столом светлее всех вот это открытие давайте проверим еще раз": {
   "file": "audio/vo/light2_win_under.mp3",
   "who": "robik",
   "id": "light2_win_under",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково читать можно и там и там": {
   "file": "audio/vo/light2_tie.mp3",
   "who": "robik",
   "id": "light2_tie",
   "fx": "robotC",
   "gain": 0.72
  },
  "смотритель дочитал а кораблик ждет мигайте фонариком включили выключили": {
   "file": "audio/vo/light2_game.mp3",
   "who": "robik",
   "id": "light2_game",
   "fx": "robotC",
   "gain": 0.71
  },
  "мы узнали у окна и под лампой светло а там куда свет не доходит тень наклейка лучик в альбом группы": {
   "file": "audio/vo/light2_sticker.mp3",
   "who": "robik",
   "id": "light2_sticker",
   "fx": "robotC",
   "gain": 0.72
  },
  "башня звуков сегодня в башне концерт и робик выбирает кто будет главным барабанщиком": {
   "file": "audio/vo/sound2_narr.mp3",
   "who": "narrator",
   "id": "sound2_narr",
   "gain": 0.57
  },
  "барабанщиком станет самый громкий звук давайте узнаем какой": {
   "file": "audio/vo/sound2_intro.mp3",
   "who": "robik",
   "id": "sound2_intro",
   "fx": "robotC",
   "gain": 0.71
  },
  "какой звук будет громче всех": {
   "file": "audio/vo/sound2_guess.mp3",
   "who": "robik",
   "id": "sound2_guess",
   "fx": "robotC",
   "gain": 0.7
  },
  "хлопок он звонкий": {
   "file": "audio/vo/sound2_opt_clap.mp3",
   "who": "asya",
   "id": "sound2_opt_clap",
   "gain": 0.62
  },
  "топот пол прямо дрожит": {
   "file": "audio/vo/sound2_opt_stomp.mp3",
   "who": "tim",
   "id": "sound2_opt_stomp",
   "gain": 0.54
  },
  "а может голос": {
   "file": "audio/vo/sound2_opt_voice.mp3",
   "who": "robik",
   "id": "sound2_opt_voice",
   "fx": "robotC",
   "gain": 0.71
  },
  "сначала пошепчите мне что нибудь": {
   "file": "audio/vo/sound2_c_whisper.mp3",
   "who": "robik",
   "id": "sound2_c_whisper",
   "fx": "robotC",
   "gain": 0.7
  },
  "запомнил шепот": {
   "file": "audio/vo/sound2_m_whisper.mp3",
   "who": "robik",
   "id": "sound2_m_whisper",
   "fx": "robotC",
   "gain": 0.71
  },
  "теперь скажите что нибудь обычным голосом не кричите": {
   "file": "audio/vo/sound2_c_voice.mp3",
   "who": "robik",
   "id": "sound2_c_voice",
   "fx": "robotC",
   "gain": 0.72
  },
  "запомнил голос": {
   "file": "audio/vo/sound2_m_voice.mp3",
   "who": "robik",
   "id": "sound2_m_voice",
   "fx": "robotC",
   "gain": 0.7
  },
  "а теперь похлопайте в ладоши": {
   "file": "audio/vo/sound2_c_clap.mp3",
   "who": "robik",
   "id": "sound2_c_clap",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил хлопок": {
   "file": "audio/vo/sound2_m_clap.mp3",
   "who": "robik",
   "id": "sound2_m_clap",
   "fx": "robotC",
   "gain": 0.7
  },
  "и потопайте ногами": {
   "file": "audio/vo/sound2_c_stomp.mp3",
   "who": "robik",
   "id": "sound2_c_stomp",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил топот": {
   "file": "audio/vo/sound2_m_stomp.mp3",
   "who": "robik",
   "id": "sound2_m_stomp",
   "fx": "robotC",
   "gain": 0.67
  },
  "громче всех хлопок права ася хлопок будет барабанщиком": {
   "file": "audio/vo/sound2_win_clap.mp3",
   "who": "robik",
   "id": "sound2_win_clap",
   "fx": "robotC",
   "gain": 0.71
  },
  "громче всех топот прав тим топот будет барабанщиком": {
   "file": "audio/vo/sound2_win_stomp.mp3",
   "who": "robik",
   "id": "sound2_win_stomp",
   "fx": "robotC",
   "gain": 0.73
  },
  "громче всех голос вот это открытие будем петь": {
   "file": "audio/vo/sound2_win_voice.mp3",
   "who": "robik",
   "id": "sound2_win_voice",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково будет два барабанщика": {
   "file": "audio/vo/sound2_tie.mp3",
   "who": "robik",
   "id": "sound2_tie",
   "fx": "robotC",
   "gain": 0.71
  },
  "после концерта совенок уснул помогите мне тихонько дойти до печенья": {
   "file": "audio/vo/sound2_game.mp3",
   "who": "robik",
   "id": "sound2_game",
   "fx": "robotC",
   "gain": 0.71
  },
  "мы узнали звуки бывают тихие и громкие и громкость можно измерить наклейка колокольчик в альбом группы": {
   "file": "audio/vo/sound2_sticker.mp3",
   "who": "robik",
   "id": "sound2_sticker",
   "fx": "robotC",
   "gain": 0.71
  },
  "метеостанция робик смотрит на облака и думает откуда в небе столько воды": {
   "file": "audio/vo/weather2_narr.mp3",
   "who": "narrator",
   "id": "weather2_narr",
   "gain": 0.57
  },
  "вода умеет улетать в воздух давайте узнаем откуда она улетает больше всего": {
   "file": "audio/vo/weather2_intro.mp3",
   "who": "robik",
   "id": "weather2_intro",
   "fx": "robotC",
   "gain": 0.7
  },
  "откуда в воздух улетает больше всего воды": {
   "file": "audio/vo/weather2_guess.mp3",
   "who": "robik",
   "id": "weather2_guess",
   "fx": "robotC",
   "gain": 0.71
  },
  "из теплой от чая же идет пар": {
   "file": "audio/vo/weather2_opt_warmcup.mp3",
   "who": "asya",
   "id": "weather2_opt_warmcup",
   "gain": 0.69
  },
  "от цветка мы его только что полили": {
   "file": "audio/vo/weather2_opt_plant.mp3",
   "who": "tim",
   "id": "weather2_opt_plant",
   "gain": 0.62
  },
  "а может из холодной": {
   "file": "audio/vo/weather2_opt_coldcup.mp3",
   "who": "robik",
   "id": "weather2_opt_coldcup",
   "fx": "robotC",
   "gain": 0.7
  },
  "подержите меня над стаканом с холодной водой": {
   "file": "audio/vo/weather2_c_coldcup.mp3",
   "who": "robik",
   "id": "weather2_c_coldcup",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил холодная вода": {
   "file": "audio/vo/weather2_m_coldcup.mp3",
   "who": "robik",
   "id": "weather2_m_coldcup",
   "fx": "robotC",
   "gain": 0.71
  },
  "теперь у политого цветка около листьев": {
   "file": "audio/vo/weather2_c_plant.mp3",
   "who": "robik",
   "id": "weather2_c_plant",
   "fx": "robotC",
   "gain": 0.71
  },
  "запомнил цветок": {
   "file": "audio/vo/weather2_m_plant.mp3",
   "who": "robik",
   "id": "weather2_m_plant",
   "fx": "robotC",
   "gain": 0.71
  },
  "а теперь над стаканом с теплой водой": {
   "file": "audio/vo/weather2_c_warmcup.mp3",
   "who": "robik",
   "id": "weather2_c_warmcup",
   "fx": "robotC",
   "gain": 0.7
  },
  "запомнил теплая вода": {
   "file": "audio/vo/weather2_m_warmcup.mp3",
   "who": "robik",
   "id": "weather2_m_warmcup",
   "fx": "robotC",
   "gain": 0.71
  },
  "больше всего воды улетает из теплого стакана права ася тепло помогает воде улетать": {
   "file": "audio/vo/weather2_win_warmcup.mp3",
   "who": "robik",
   "id": "weather2_win_warmcup",
   "fx": "robotC",
   "gain": 0.71
  },
  "больше всего воды у цветка прав тим листья тоже дышат водой": {
   "file": "audio/vo/weather2_win_plant.mp3",
   "who": "robik",
   "id": "weather2_win_plant",
   "fx": "robotC",
   "gain": 0.74
  },
  "больше всего воды над холодным стаканом вот это открытие давайте проверим еще раз": {
   "file": "audio/vo/weather2_win_coldcup.mp3",
   "who": "robik",
   "id": "weather2_win_coldcup",
   "fx": "robotC",
   "gain": 0.71
  },
  "почти одинаково вода улетает отовсюду понемножку": {
   "file": "audio/vo/weather2_tie.mp3",
   "who": "robik",
   "id": "weather2_tie",
   "fx": "robotC",
   "gain": 0.7
  },
  "сделаем свое облако дышите на меня по очереди ха а а": {
   "file": "audio/vo/weather2_game.mp3",
   "who": "robik",
   "id": "weather2_game",
   "fx": "robotC",
   "gain": 0.71
  },
  "мы узнали вода улетает в воздух и теплая улетает быстрее так рождаются облака наклейка капелька в альбом группы": {
   "file": "audio/vo/weather2_sticker.mp3",
   "who": "robik",
   "id": "weather2_sticker",
   "fx": "robotC",
   "gain": 0.71
  },
  "маяк света смотрительница маяка хочет почитать книжку но не знает где в комнате светлее": {
   "file": "audio/vo/light2_narr.mp3",
   "who": "narrator",
   "id": "light2_narr",
   "gain": 0.62
  },
  "здравствуйте ребята помогите мне найти самое светлое место чтобы читать книжку": {
   "file": "audio/vo/light2_guest0.mp3",
   "who": "keeper",
   "id": "light2_guest0",
   "gain": 0.84
  },
  "р р р я шумозавр обожаю громкие звуки можно я тоже послушаю": {
   "file": "audio/vo/sound2_guest0.mp3",
   "who": "shum",
   "id": "sound2_guest0",
   "gain": 0.94
  },
  "уху у кто это шумит я так сладко спал": {
   "file": "audio/vo/g_owlet_wake.mp3",
   "who": "owlet",
   "id": "g_owlet_wake",
   "gain": 0.54
  }
 }
};
