(function(){
  'use strict';
var categories = [
    { id: "morning", name: "Morning & Evening", icon: "🌅", note: "Begin and end the day with remembrance." },
    { id: "prayer", name: "Prayer & Mosque", icon: "🕌", note: "Duas for the masjid and moments around salah." },
    { id: "praise", name: "Praising Allah", icon: "✨", note: "Words of gratitude, glorification, and remembrance." },
    { id: "travel", name: "Travel", icon: "🧭", note: "Remember Allah when setting out and returning." },
    { id: "distress", name: "Joy & Distress", icon: "🤲", note: "Supplications for hardship, worry, and gratitude." },
    { id: "home", name: "Home & Family", icon: "🏡", note: "Remembrance at home and Quranic prayers for family." },
    { id: "food", name: "Food & Drink", icon: "🍽️", note: "Before, during, and after a meal; fasting." },
    { id: "sleep", name: "Sleep & Waking", icon: "🌙", note: "Remembrance for rest and a new morning." },
    { id: "protection", name: "Protection", icon: "🛡️", note: "Seek Allah’s protection through Quran and remembrance." },
    { id: "forgiveness", name: "Forgiveness", icon: "💧", note: "Ask Allah for pardon and turn back to Him." },
    { id: "hajj", name: "Hajj & Umrah", icon: "🕋", note: "Talbiyah and remembrance for the sacred journey." },
    { id: "health", name: "Sickness & Loss", icon: "🌿", note: "Duas for healing, patience, and comfort." }
  ];
var entries = [
    { id:"morning-01", cat:"morning", title:"A morning remembrance", ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", tr:"Aṣbaḥnā wa aṣbaḥal-mulku lillāh, wal-ḥamdu lillāh. Lā ilāha illallāhu waḥdahu lā sharīka lah.", en:"We have entered the morning and the dominion belongs to Allah. Praise belongs to Allah. There is no god but Allah alone, without partner.", source:"Hisn al-Muslim · Morning remembrance", href:"https://sunnah.com/hisn", note:"A morning remembrance; the evening wording begins “We have entered the evening.”" },
    { id:"morning-02", cat:"morning", title:"Protection in the morning and evening", ar:"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", tr:"Bismillāhilladhī lā yaḍurru maʿa ismihi shay’un fil-arḍi wa lā fis-samā’i wa huwas-Samīʿul-ʿAlīm.", en:"In the name of Allah, with whose name nothing on earth or in heaven can cause harm. He is the All-Hearing, the All-Knowing.", source:"Hisn al-Muslim · Morning and evening adhkar", href:"https://sunnah.com/hisn", note:"Traditionally recited three times in the morning and evening." },
    { id:"morning-03", cat:"morning", title:"The master supplication for forgiveness", ar:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", tr:"Allāhumma anta rabbī, lā ilāha illā anta, khalaqtanī wa anā ʿabduk, wa anā ʿalā ʿahdika wa waʿdika mastaṭaʿt. Aʿūdhu bika min sharri mā ṣanaʿt. Abū’u laka biniʿmatika ʿalayya, wa abū’u bidhanbī, faghfir lī fa-innahū lā yaghfirudh-dhunūba illā ant.", en:"O Allah, You are my Lord; there is no god but You. You created me and I am Your servant. I uphold my covenant with You as best I can. I seek refuge in You from the evil I have done. I acknowledge Your blessings upon me and my sin, so forgive me; none forgives sins but You.", source:"Sahih al-Bukhari 6306 · Hisn al-Muslim 90", href:"https://sunnah.com/bukhari:6306", note:"Known as Sayyid al-Istighfar. The hadith describes its morning or evening recitation." },
    { id:"prayer-01", cat:"prayer", title:"On entering the mosque", ar:"اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", tr:"Allāhummaftaḥ lī abwāba raḥmatik.", en:"O Allah, open for me the gates of Your mercy.", source:"Sahih Muslim 713 · Hisn al-Muslim 20", href:"https://sunnah.com/muslim:713", note:"Recite when entering the mosque." },
    { id:"prayer-02", cat:"prayer", title:"On leaving the mosque", ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", tr:"Allāhumma innī as’aluka min faḍlik.", en:"O Allah, I ask You for Your bounty.", source:"Sahih Muslim 713 · Hisn al-Muslim 21", href:"https://sunnah.com/muslim:713", note:"Recite when leaving the mosque." },
    { id:"prayer-03", cat:"prayer", title:"A prayer for this life and the next", ar:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", tr:"Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ʿadhāban-nār.", en:"Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.", source:"Quran 2:201", href:"https://quran.com/2/201", note:"A Quranic supplication often recited by the Prophet ﷺ." },
    { id:"praise-01", cat:"praise", title:"Glory and praise be to Allah", ar:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", tr:"Subḥānallāhi wa biḥamdih.", en:"Glory be to Allah and praise be to Him.", source:"Sahih al-Bukhari 6405 · Sahih Muslim 2691", href:"https://sunnah.com/bukhari:6405", note:"The hadith describes saying this one hundred times in a day." },
    { id:"praise-02", cat:"praise", title:"Words beloved to Allah", ar:"سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", tr:"Subḥānallāh, wal-ḥamdu lillāh, wa lā ilāha illallāh, wallāhu akbar.", en:"Glory be to Allah; praise be to Allah; there is no god but Allah; Allah is the Greatest.", source:"Sahih Muslim 2137 · Hisn al-Muslim", href:"https://sunnah.com/muslim:2137", note:"Four phrases of remembrance." },
    { id:"travel-01", cat:"travel", title:"When setting out on a journey", ar:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", tr:"Subḥānalladhī sakhkhara lanā hādhā wa mā kunnā lahū muqrinīn, wa innā ilā rabbinā lamunqalibūn.", en:"Glory be to the One who has made this serviceable for us, and we could not have done so ourselves. Surely to our Lord we will return.", source:"Quran 43:13–14 · Sahih Muslim 1342", href:"https://quran.com/43/13-14", note:"Part of the supplication for mounting a ride or setting out." },
    { id:"travel-02", cat:"travel", title:"When stopping during a journey", ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", tr:"Aʿūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq.", en:"I seek refuge in the perfect words of Allah from the evil of what He has created.", source:"Sahih Muslim 2708 · Hisn al-Muslim 216", href:"https://sunnah.com/muslim:2708", note:"A remembrance when stopping or lodging somewhere." },
    { id:"travel-03", cat:"travel", title:"A traveler's return", ar:"آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ", tr:"Āyibūna, tā’ibūna, ʿābidūna, li-rabbinā ḥāmidūn.", en:"We return, repenting, worshipping our Lord, and praising Him.", source:"Sahih al-Bukhari 1797 · Sahih Muslim 1344", href:"https://sunnah.com/muslim:1344", note:"Part of the remembrance on returning from travel." },
    { id:"distress-01", cat:"distress", title:"When facing a difficult matter", ar:"اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا", tr:"Allāhumma lā sahla illā mā jaʿaltahū sahlā, wa anta tajʿalul-ḥazna idhā shi’ta sahlā.", en:"O Allah, nothing is easy except what You make easy, and You can make hardship easy if You will.", source:"Hisn al-Muslim 139", href:"https://sunnah.com/hisn/139", note:"A supplication for when something feels difficult." },
    { id:"distress-02", cat:"distress", title:"For worry and sorrow", ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ", tr:"Allāhumma innī aʿūdhu bika minal-hammi wal-ḥazan, wal-ʿajzi wal-kasal, wal-bukhli wal-jubn, wa ḍalaʿid-dayni wa ghalabatir-rijāl.", en:"O Allah, I seek refuge in You from worry and grief, incapacity and laziness, miserliness and cowardice, the burden of debt, and being overpowered by others.", source:"Sahih al-Bukhari 6369 · Hisn al-Muslim 137", href:"https://sunnah.com/bukhari:6369", note:"A comprehensive supplication seeking refuge from distress." },
    { id:"distress-03", cat:"distress", title:"The supplication of Prophet Yunus", ar:"لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", tr:"Lā ilāha illā anta, subḥānaka, innī kuntu minaẓ-ẓālimīn.", en:"There is no god but You. Glory be to You. I have truly been among the wrongdoers.", source:"Quran 21:87", href:"https://quran.com/21/87", note:"The prayer of Prophet Yunus عليه السلام in the depths of darkness." },
    { id:"distress-04", cat:"distress", title:"For patience and steadiness", ar:"رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا", tr:"Rabbanā afrigh ʿalaynā ṣabran wa thabbit aqdāmanā.", en:"Our Lord, pour patience upon us and make our steps firm.", source:"Quran 2:250", href:"https://quran.com/2/250", note:"A Quranic prayer for patience and resolve. The recording plays the complete ayah." },
    { id:"home-01", cat:"home", title:"When leaving home", ar:"بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", tr:"Bismillāh, tawakkaltu ʿalallāh, wa lā ḥawla wa lā quwwata illā billāh.", en:"In the name of Allah. I place my trust in Allah; there is no might or power except through Allah.", source:"Sunan Abi Dawud 5095 · Hisn al-Muslim 16", href:"https://sunnah.com/abudawud:5095", note:"A remembrance to say when going out." },
    { id:"home-02", cat:"home", title:"When entering home", ar:"بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا", tr:"Bismillāhi walajnā, wa bismillāhi kharajnā, wa ʿalā rabbinā tawakkalnā.", en:"In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.", source:"Sunan Abi Dawud 5096 · Hisn al-Muslim 18", href:"https://sunnah.com/hisn/18", note:"Then greet the people at home with peace." },
    { id:"home-03", cat:"home", title:"A prayer for a peaceful family", ar:"رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا", tr:"Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata aʿyunin wajʿalnā lil-muttaqīna imāmā.", en:"Our Lord, grant us comfort in our spouses and children, and make us an example for the mindful.", source:"Quran 25:74", href:"https://quran.com/25/74", note:"A Quranic supplication for spouses, children, and a household rooted in goodness." },
    { id:"home-04", cat:"home", title:"For children to establish prayer", ar:"رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ", tr:"Rabbi-jʿalnī muqīmaṣ-ṣalāti wa min dhurriyyatī, rabbanā wa taqabbal duʿā’.", en:"My Lord, make me steadfast in prayer, and my descendants too. Our Lord, accept my supplication.", source:"Quran 14:40", href:"https://quran.com/14/40", note:"A prayer of Prophet Ibrahim عليه السلام." },
    { id:"food-01", cat:"food", title:"Before eating", ar:"بِسْمِ اللَّهِ", tr:"Bismillāh.", en:"In the name of Allah.", source:"Sahih al-Bukhari 5376 · Hisn al-Muslim 178", href:"https://sunnah.com/bukhari:5376", note:"Say it before beginning a meal. If forgotten, say the longer remembrance below when you remember." },
    { id:"food-02", cat:"food", title:"If you forgot to begin with Allah's name", ar:"بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ", tr:"Bismillāhi fī awwalihi wa ākhirih.", en:"In the name of Allah, at its beginning and its end.", source:"Sunan Abi Dawud 3767 · Hisn al-Muslim 178", href:"https://sunnah.com/abudawud:3767", note:"Say this when you remember after starting to eat." },
    { id:"food-03", cat:"food", title:"After finishing a meal", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", tr:"Alḥamdu lillāhilladhī aṭʿamanī hādhā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah.", en:"Praise belongs to Allah, who fed me this and provided it for me without any strength or power of my own.", source:"Jamiʿ at-Tirmidhi 3458 · Hisn al-Muslim 180", href:"https://sunnah.com/hisn/180", note:"A remembrance of gratitude after eating." },
    { id:"food-04", cat:"food", title:"When breaking the fast", ar:"ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ", tr:"Dhahabaẓ-ẓama’u wabtallatil-ʿurūqu wa thabatal-ajru in shā’ Allāh.", en:"The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.", source:"Sunan Abi Dawud 2357 · Hisn al-Muslim 176", href:"https://sunnah.com/abudawud:2357", note:"A supplication reported for after breaking the fast." },
    { id:"sleep-01", cat:"sleep", title:"Before sleeping", ar:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", tr:"Bismika Allāhumma amūtu wa aḥyā.", en:"In Your name, O Allah, I die and I live.", source:"Sahih al-Bukhari 6324 · Hisn al-Muslim 99", href:"https://sunnah.com/bukhari:6324", note:"A short remembrance before going to sleep." },
    { id:"sleep-02", cat:"sleep", title:"Upon waking", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", tr:"Alḥamdu lillāhilladhī aḥyānā baʿda mā amātanā wa ilayhin-nushūr.", en:"Praise belongs to Allah, who gave us life after causing us to die, and to Him is the resurrection.", source:"Sahih al-Bukhari 6312 · Hisn al-Muslim 100", href:"https://sunnah.com/bukhari:6312", note:"A remembrance to say when waking." },
    { id:"protection-01", cat:"protection", title:"Seeking refuge from harm", ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", tr:"Aʿūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq.", en:"I seek refuge in the perfect words of Allah from the evil of what He has created.", source:"Sahih Muslim 2708 · Hisn al-Muslim 216", href:"https://sunnah.com/muslim:2708", note:"Reported for protection when stopping at a place." },
    { id:"protection-02", cat:"protection", title:"Surah Al-Ikhlas", ar:"قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ", tr:"Qul huwallāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahū kufuwan aḥad.", en:"Say: He is Allah, the One; Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.", source:"Quran 112:1–4 · Hisn al-Muslim 99", href:"https://quran.com/112", note:"The Prophet ﷺ recited Al-Ikhlas, Al-Falaq, and An-Nas before sleep." },
    { id:"forgiveness-01", cat:"forgiveness", title:"Seeking forgiveness and turning back", ar:"أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", tr:"Astaghfirullāha wa atūbu ilayh.", en:"I seek the forgiveness of Allah and turn back to Him in repentance.", source:"Sahih al-Bukhari 6307 · Hisn al-Muslim 96", href:"https://sunnah.com/hisn:96", note:"The Prophet ﷺ sought forgiveness and repented to Allah frequently each day." },
    { id:"forgiveness-02", cat:"forgiveness", title:"A prayer for forgiveness and mercy", ar:"رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", tr:"Rabbanā ẓalamnā anfusanā wa illam taghfir lanā wa tarḥamnā lanakūnanna minal-khāsirīn.", en:"Our Lord, we have wronged ourselves. If You do not forgive us and have mercy upon us, we will surely be among the losers.", source:"Quran 7:23", href:"https://quran.com/7/23", note:"The prayer of Adam and his wife عليهما السلام." },
    { id:"hajj-01", cat:"hajj", title:"The Talbiyah", ar:"لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ", tr:"Labbayk Allāhumma labbayk. Labbayka lā sharīka laka labbayk. Innal-ḥamda wan-niʿmata laka wal-mulk, lā sharīka lak.", en:"Here I am, O Allah, here I am. You have no partner; here I am. Truly all praise, blessings, and dominion belong to You. You have no partner.", source:"Sahih al-Bukhari 1549 · Sahih Muslim 1184", href:"https://sunnah.com/muslim:1184", note:"The Prophet's talbiyah during Hajj and Umrah." },
    { id:"health-01", cat:"health", title:"A prayer for healing", ar:"اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا", tr:"Allāhumma Rabban-nās, adhhib al-ba’s, ishfi antash-Shāfī, lā shifā’a illā shifā’uk, shifā’an lā yughādiru saqamā.", en:"O Allah, Lord of mankind, remove the harm and heal; You are the Healer. There is no healing except Your healing, a healing that leaves no illness.", source:"Sahih al-Bukhari 5743 · Sahih Muslim 2191", href:"https://sunnah.com/bukhari:5743", note:"A supplication for someone who is ill." },
    { id:"health-02", cat:"health", title:"When struck by a calamity", ar:"إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا", tr:"Innā lillāhi wa innā ilayhi rājiʿūn. Allāhumma’jurnī fī muṣībatī wa akhlif lī khayran minhā.", en:"We belong to Allah and to Him we return. O Allah, reward me through my affliction and replace it for me with something better.", source:"Quran 2:156 · Sahih Muslim 918", href:"https://sunnah.com/muslim:918", note:"The Prophet ﷺ taught this response when a person is afflicted by a calamity." }
  ];

  function loadJsonV1(key, fallback) {
    try { var value = JSON.parse(localStorage.getItem(key)); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function saveJsonV1(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function escapeDuaV1(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  var duaStateV1 = {
    bookmarks: loadJsonV1("noor-dua-prototype-bookmarks", loadJsonV1("noor-dua-saved-v6", [])),
    recents: loadJsonV1("noor-dua-prototype-recents", []),
    read: loadJsonV1("noor-dua-prototype-read", []),
    visible: loadJsonV1("noor-dua-prototype-text", {arabic:true, transliteration:true, translation:true}),
    arabicSize: Number(loadJsonV1("noor-dua-prototype-text-size", 30)) || 30
  };
  function persistDuaV1() {
    saveJsonV1("noor-dua-prototype-bookmarks", duaStateV1.bookmarks);
    saveJsonV1("noor-dua-prototype-recents", duaStateV1.recents);
    saveJsonV1("noor-dua-prototype-read", duaStateV1.read);
    saveJsonV1("noor-dua-prototype-text", duaStateV1.visible);
    saveJsonV1("noor-dua-prototype-text-size", duaStateV1.arabicSize);
  }

  var duaEntriesV1 = entries.map(function (x) {
    return {
      id:x.id, title:x.title, category:x.cat, chapter:x.cat + "-chapter",
      arabic:x.ar, transliteration:x.tr, translation:x.en,
      reference:x.source || "Source reference not provided", sourceUrl:x.href || "",
      occasion:x.note || "Everyday supplication"
    };
  });
  function artNameDuaV1(id) {
    return ({food:"food",morning:"dawn",prayer:"mosque",travel:"travel",distress:"mountains",home:"home",sleep:"moon",protection:"mountains",forgiveness:"dawn",hajj:"mosque",health:"home",praise:"dawn"})[id] || "dawn";
  }
  var duaCategoriesV1 = categories.map(function (c) {
    var selected = duaEntriesV1.filter(function (e) { return e.category === c.id; });
    var chapter = {
      slug:c.id + "-chapter",
      title:"Supplications",
      description:c.note,
      category:c.id,
      entries:selected.map(function (e) { return e.id; })
    };
    return {
      id:c.id, slug:c.id, title:c.name, subtitle:c.note, group:"Dua collections",
      note:c.note, icon:c.icon, art:artNameDuaV1(c.id), chapters:[chapter]
    };
  });
  var duaByIdV1 = {};
  var duaByChapterV1 = {};
  var duaByCategoryV1 = {};
  duaEntriesV1.forEach(function (e) { duaByIdV1[e.id] = e; });
  duaCategoriesV1.forEach(function (c) {
    duaByCategoryV1[c.slug] = c;
    c.chapters.forEach(function (ch) { duaByChapterV1[ch.slug] = ch; });
  });
  function categoryDuaV1(slug) { return duaByCategoryV1[slug] || null; }
  function chapterDuaV1(slug) { return duaByChapterV1[slug] || null; }
  function itemDuaV1(id) { return duaByIdV1[id] || null; }
  function savedDuaV1(id) { return duaStateV1.bookmarks.indexOf("d:" + id) >= 0; }
  function markDuaV1(id) { return duaStateV1.read.indexOf(id) >= 0; }
  function topDuaV1(title, back, right) {
    return '<div class="dua-topbar"><a class="dua-back" href="' + escapeDuaV1(back || "#/duas") + '" aria-label="Back">‹</a><h1>' + escapeDuaV1(title) + '</h1><div class="dua-top-actions">' + (right || '<a href="#/dua-special/bookmarks" aria-label="Saved duas">☆</a>') + '</div></div>';
  }
  function artDuaV1(art, icon, extra) {
    return '<div class="dua-art art-' + escapeDuaV1(art || "dawn") + (extra ? " " + extra : "") + '" aria-hidden="true"><span>' + escapeDuaV1(icon || "☾") + '</span><i class="art-star s1"></i><i class="art-star s2"></i><i class="art-hill h1"></i><i class="art-hill h2"></i></div>';
  }
  function navDuaV1(active) {
    var quranIcon = '<svg class="dua-nav-quran-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 7.4C9.7 5.7 6.6 5.4 3.5 6.2v11.2c3.1-.8 6.2-.5 8.5 1.3 2.3-1.8 5.4-2.1 8.5-1.3V6.2c-3.1-.8-6.2-.5-8.5 1.2Z"/><path d="M12 7.4v11.3M6.2 9.1c1.6-.2 3.2.1 4.5 1M17.8 9.1c-1.6-.2-3.2.1-4.5 1"/><path d="M15.9 2.8a4 4 0 0 0 3.8 6.4A4.7 4.7 0 1 1 15.9 2.8Z"/><path d="m20.8 1.5.45 1.1 1.2.1-.9.8.3 1.2-1.05-.65-1.05.65.3-1.2-.9-.8 1.2-.1z"/></svg>';
    return '<nav class="dua-bottom-nav" aria-label="App navigation">' +
      '<a href="#/home" aria-label="Home">⌂<span>Home</span></a>' +
      '<a href="#/quran" aria-label="Quran">' + quranIcon + '<span>Quran</span></a>' +
      '<a class="' + (active === "duas" ? "on" : "") + '" href="#/duas" aria-label="Duas">☾<span>Duas</span></a>' +
      '<a href="#/tasbih" aria-label="Tasbih">◉<span>Tasbih</span></a>' +
      '<a class="' + (active === "saved" ? "on" : "") + '" href="#/dua-special/bookmarks" aria-label="Saved">☆<span>Saved</span></a>' +
      '</nav>';
  }
  function duaLandingViewV1() {
    var cats = duaCategoriesV1;
    var essentialIds = ["home-01","food-01","distress-01","sleep-01"];
    return '<section class="dua-page dua-library">' +
      topDuaV1("Duas", "#/home", '<a class="dua-favorite-trigger" href="#/dua-special/bookmarks" aria-label="Open saved duas" title="Saved duas"><svg class="dua-header-heart" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.8 4.7a5.2 5.2 0 0 0-7.4 0L12 6.1l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4l1.4 1.4L12 20l7.4-6.5 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z"/></svg></a>') +
      '<div class="dua-search-wrap"><span>⌕</span><input id="dua-search" type="search" placeholder="Search duas, occasions, or categories" autocomplete="off" aria-label="Search duas"><button id="dua-clear-search" type="button" data-act="dua-clear-search" aria-label="Clear search" hidden>×</button></div>' +
      '<div id="dua-search-results" class="dua-search-results" hidden></div>' +
      '<div class="dua-shortcuts dua-shortcuts-grid-v1" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 24px;padding:10px;background:rgba(217,242,231,.055);border:1px solid rgba(230,248,239,.12);border-radius:17px">' +
        '<a href="#/dua-special/bookmarks" style="display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;justify-items:start;column-gap:8px;row-gap:2px;min-width:0;min-height:60px;padding:8px;text-align:left;text-decoration:none;color:#e8f3ee;background:rgba(222,245,235,.055);border:1px solid rgba(226,245,235,.09);border-radius:12px;font-size:11px;line-height:1.3"><span class="shortcut-icon" style="grid-column:1;grid-row:1/span 2;display:grid;place-items:center;width:34px;height:36px;font-size:22px">🔖</span><span style="grid-column:2;grid-row:1;min-width:0;overflow-wrap:anywhere">Bookmarks</span><small style="grid-column:2;grid-row:2;display:block;width:100%;min-width:0;color:#aac8bf;font-size:10px;line-height:1.25;text-align:left;white-space:normal;overflow-wrap:anywhere">' + duaStateV1.bookmarks.filter(function (k) { return k.indexOf("d:") === 0; }).length + ' saved</small></a>' +
        '<a href="#/dua-special/recents" style="display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;justify-items:start;column-gap:8px;row-gap:2px;min-width:0;min-height:60px;padding:8px;text-align:left;text-decoration:none;color:#e8f3ee;background:rgba(222,245,235,.055);border:1px solid rgba(226,245,235,.09);border-radius:12px;font-size:11px;line-height:1.3"><span class="shortcut-icon" style="grid-column:1;grid-row:1/span 2;display:grid;place-items:center;width:34px;height:36px;font-size:22px">◷</span><span style="grid-column:2;grid-row:1;min-width:0;overflow-wrap:anywhere">Recents</span><small style="grid-column:2;grid-row:2;display:block;width:100%;min-width:0;color:#aac8bf;font-size:10px;line-height:1.25;text-align:left;white-space:normal;overflow-wrap:anywhere">' + duaStateV1.recents.length + ' viewed</small></a>' +
        '<a href="#/dua-special/collection" style="display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;justify-items:start;column-gap:8px;row-gap:2px;min-width:0;min-height:60px;padding:8px;text-align:left;text-decoration:none;color:#e8f3ee;background:rgba(222,245,235,.055);border:1px solid rgba(226,245,235,.09);border-radius:12px;font-size:11px;line-height:1.3"><span class="shortcut-icon" style="grid-column:1;grid-row:1/span 2;display:grid;place-items:center;width:34px;height:36px;font-size:22px">📖</span><span style="grid-column:2;grid-row:1;min-width:0;overflow-wrap:anywhere">Hisnul Muslim</span><small style="grid-column:2;grid-row:2;display:block;width:100%;min-width:0;color:#aac8bf;font-size:10px;line-height:1.25;text-align:left;white-space:normal;overflow-wrap:anywhere">Collections</small></a>' +
        '<a href="#/tasbih" style="display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;justify-items:start;column-gap:8px;row-gap:2px;min-width:0;min-height:60px;padding:8px;text-align:left;text-decoration:none;color:#e8f3ee;background:rgba(222,245,235,.055);border:1px solid rgba(226,245,235,.09);border-radius:12px;font-size:11px;line-height:1.3"><span class="shortcut-icon" style="grid-column:1;grid-row:1/span 2;display:grid;place-items:center;width:34px;height:36px;font-size:22px">📿</span><span style="grid-column:2;grid-row:1;min-width:0;overflow-wrap:anywhere">Tasbih</span><small style="grid-column:2;grid-row:2;display:block;width:100%;min-width:0;color:#aac8bf;font-size:10px;line-height:1.25;text-align:left;white-space:normal;overflow-wrap:anywhere">Dhikr counter</small></a></div>' +
      '<div class="dua-section-head"><div><p class="dua-eyebrow">A MOMENT OF REMEMBRANCE</p><h2>Daily Remembrances</h2></div><a href="#/dua-special/daily">See all ↗</a></div>' +
      '<a class="dua-feature-card" href="#/dua-special/daily">' + artDuaV1("dawn","☾") + '<div class="dua-feature-copy"><span class="dua-tag">CURATED COLLECTION</span><h3>Daily adhkar</h3><p>Morning, evening, and everyday remembrances</p><small>' + (categoryDuaV1("morning") ? categoryDuaV1("morning").chapters[0].entries.length : 0) + ' supplications in this collection <span>→</span></small></div></a>' +
      '<div class="dua-section-head"><div><p class="dua-eyebrow">EXPLORE COLLECTIONS</p><h2>Hisnul Muslim</h2></div><a href="#/dua-special/collection">View all ↗</a></div>' +
      '<div class="dua-card-scroller">' + cats.filter(function (c) { return ["food","morning","travel","sleep","prayer"].indexOf(c.slug) >= 0; }).map(function (c) {
        return '<a class="dua-category-card" href="#/dua-category/' + c.slug + '">' + artDuaV1(c.art,c.icon) + '<div class="dua-category-copy"><h3>' + escapeDuaV1(c.title) + '</h3><p>' + c.chapters.length + ' chapters</p></div></a>';
      }).join("") + '</div>' +
      '<div class="dua-section-head"><div><p class="dua-eyebrow">FROM THE QURAN & DAILY LIFE</p><h2>Essential Duas</h2></div><a href="#/dua-special/collection">See all ↗</a></div>' +
      '<div class="dua-essential-grid">' + cats.filter(function (c) { return ["home","food","distress","sleep"].indexOf(c.slug) >= 0; }).map(function (c) {
        return '<a class="dua-essential-card" href="#/dua-category/' + c.slug + '">' + artDuaV1(c.art,c.icon) + '<div><h3>' + escapeDuaV1(c.title) + '</h3><p>' + c.chapters.length + ' topics</p><span>Explore collection ↗</span></div></a>';
      }).join("") + '</div>' +
      '<div class="dua-note">A source-linked starter collection. Check each reference for original text and narration context.</div>' + navDuaV1("duas") + '</section>';
  }
  function duaCategoryViewV1(slug) {
    var c = categoryDuaV1(slug);
    if (!c) return duaLandingViewV1();
    var all = c.chapters.reduce(function (n,ch) { return n + ch.entries.length; }, 0);
    return '<section class="dua-page dua-category-page">' +
      topDuaV1(c.title,"#/duas",'<button class="dua-icon-btn" data-act="dua-share-category" data-slug="' + c.slug + '" aria-label="Share category">↗</button>') +
      '<div class="dua-category-hero">' + artDuaV1(c.art,c.icon,"wide") + '<div><span class="dua-eyebrow">' + escapeDuaV1(c.group.toUpperCase()) + '</span><h2>' + escapeDuaV1(c.title) + '</h2><p>' + escapeDuaV1(c.subtitle) + '</p><small>' + c.chapters.length + ' chapters · ' + all + ' supplications</small></div></div>' +
      '<p class="dua-list-intro">' + escapeDuaV1(c.subtitle) + '</p>' +
      '<div class="dua-chapter-list">' + c.chapters.map(function (ch) {
        return '<a class="dua-list-row" href="#/dua-chapter/' + ch.slug + '"><span class="dua-row-book">▤</span><span class="dua-row-copy"><strong>' + escapeDuaV1(ch.title) + '</strong><small>' + ch.entries.length + ' ' + (ch.entries.length===1?'Dua':'Duas') + '</small></span><span class="dua-row-arrow">→</span></a>';
      }).join("") + '</div>' + navDuaV1("duas") + '</section>';
  }
  function duaChapterViewV1(slug) {
    var ch = chapterDuaV1(slug);
    if (!ch) return duaLandingViewV1();
    var c = categoryDuaV1(ch.category);
    return '<section class="dua-page dua-chapter-page">' +
      topDuaV1(ch.title,"#/dua-category/" + ch.category) +
      '<p class="dua-list-intro">' + escapeDuaV1(ch.description) + '</p>' +
      '<div class="dua-chapter-context">' + artDuaV1(c ? c.art : "dawn",c ? c.icon : "☾","wide") + '<div><small>' + escapeDuaV1(c ? c.title : "Duas") + '</small><h2>' + escapeDuaV1(ch.title) + '</h2><p>' + ch.entries.length + ' supplications</p></div></div>' +
      '<div class="dua-chapter-list">' + ch.entries.map(function (id,i) {
        var e = itemDuaV1(id); if (!e) return "";
        return '<div class="dua-list-row dua-entry-row"><a href="#/dua-detail/' + e.id + '/' + ch.slug + '" class="dua-entry-open"><span class="dua-row-book">▤</span><span class="dua-row-copy"><strong>' + escapeDuaV1(e.title) + '</strong><small>' + escapeDuaV1(e.occasion || "Supplication") + ' · ' + (i+1) + ' of ' + ch.entries.length + '</small></span><span class="dua-row-arrow">→</span></a><button class="dua-small-bookmark ' + (savedDuaV1(id) ? "is-saved" : "") + '" data-act="bm" data-k="d:' + e.id + '" aria-label="Bookmark ' + escapeDuaV1(e.title) + '">' + (savedDuaV1(id) ? "★" : "☆") + '</button></div>';
      }).join("") + '</div>' + navDuaV1("duas") + '</section>';
  }
  function duaDetailViewV1(id, requestedChapter) {
    var e = itemDuaV1(id);
    if (!e) return duaLandingViewV1();
    var ch = chapterDuaV1(requestedChapter) || chapterDuaV1(e.chapter);
    var ids = (ch ? ch.entries : [e.id]).filter(function (key) { return itemDuaV1(key); });
    var idx = Math.max(0, ids.indexOf(e.id));
    duaStateV1.recents = [e.id].concat(duaStateV1.recents.filter(function (key) { return key !== e.id; })).slice(0,30);
    saveJsonV1("noor-dua-prototype-recents", duaStateV1.recents);
    var previous = idx > 0 ? '<a class="dua-page-arrow" href="#/dua-detail/' + ids[idx-1] + '/' + ch.slug + '" aria-label="Previous supplication">‹</a>' : '<span class="dua-page-arrow is-disabled">‹</span>';
    var next = idx < ids.length-1 ? '<a class="dua-page-arrow" href="#/dua-detail/' + ids[idx+1] + '/' + ch.slug + '" aria-label="Next supplication">›</a>' : '<span class="dua-page-arrow is-disabled">›</span>';
    var saved = savedDuaV1(e.id), read = markDuaV1(e.id), show = duaStateV1.visible;
    return '<section class="dua-page dua-detail-page">' +
      '<div class="dua-detail-top">' + topDuaV1(e.title,"#/dua-chapter/" + (ch ? ch.slug : e.chapter),'<button class="dua-icon-btn" data-act="dua-settings" aria-label="Reading settings">⚙</button>') +
      '<div class="dua-detail-pager">' + previous + '<span>' + (idx+1) + ' <small>of</small> ' + ids.length + '</span>' + next + '</div></div>' +
      '<article class="dua-reading-card"><div class="dua-card-actions"><button class="dua-icon-btn" data-act="bm" data-k="d:' + e.id + '" aria-label="Bookmark supplication">' + (saved ? "★" : "☆") + '</button><button class="dua-icon-btn" data-act="dua-more" aria-label="More options">•••</button></div>' +
      '<div class="dua-more-menu" id="dua-more-menu" hidden><button data-act="dua-copy" data-id="' + e.id + '">Copy supplication</button><button data-act="dua-share" data-id="' + e.id + '">Share supplication</button><button data-act="dua-font" data-d="-2">Smaller Arabic text</button><button data-act="dua-font" data-d="2">Larger Arabic text</button></div>' +
      (show.arabic ? '<p class="dua-arabic" dir="rtl" lang="ar" style="font-size:' + duaStateV1.arabicSize + 'px">' + escapeDuaV1(e.arabic) + '</p>' : '') +
      (show.transliteration ? '<p class="dua-transliteration">' + escapeDuaV1(e.transliteration) + '</p>' : '') +
      (show.translation ? '<p class="dua-translation">' + escapeDuaV1(e.translation) + '</p>' : '') +
      '<p class="dua-reference">' + escapeDuaV1(e.reference) + '</p>' +
      (e.sourceUrl ? '<a class="dua-source-link" href="' + escapeDuaV1(e.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Read source ↗</a>' : '') +
      '</article><div class="dua-detail-progress"><span style="width:' + Math.round((idx+1)/ids.length*100) + '%"></span></div>' +
      '<div class="dua-detail-actions dua-detail-actions-single"><button class="dua-read-btn ' + (read ? "is-read" : "") + '" data-act="dua-read" data-id="' + e.id + '">' + (read ? "✓ Read" : "Mark as read") + '</button></div>' +
      '<div class="dua-settings-panel" id="dua-settings-panel" hidden><div class="dua-settings-head"><strong>Reading settings</strong><button data-act="dua-settings-close" aria-label="Close settings">×</button></div>' +
      [['arabic','Arabic text'],['transliteration','Transliteration'],['translation','English meaning']].map(function (row) {
        return '<label><span>' + row[1] + '</span><input type="checkbox" data-act="dua-text-toggle" data-l="' + row[0] + '" ' + (show[row[0]] ? "checked" : "") + '></label>';
      }).join("") + '<div class="row"><button class="c" data-act="dua-font" data-d="-2">A−</button><button class="c" data-act="dua-font" data-d="2">A+</button></div></div></section>';
  }
  function duaSpecialViewV1(mode) {
    var title = mode === "bookmarks" ? "Bookmarks" : mode === "recents" ? "Recents" : mode === "daily" ? "Daily Remembrances" : "Hisnul Muslim collections";
    var list = [];
    if (mode === "bookmarks") list = duaStateV1.bookmarks.filter(function (k) { return k.indexOf("d:") === 0; }).map(function (k) { return itemDuaV1(k.slice(2)); }).filter(Boolean);
    else if (mode === "recents") list = duaStateV1.recents.map(itemDuaV1).filter(Boolean);
    else if (mode === "daily") list = ["morning","sleep","prayer"].flatMap(function (slug) { var c=categoryDuaV1(slug);return c?c.chapters.flatMap(function(ch){return ch.entries.map(itemDuaV1)}):[]; }).filter(Boolean);
    else return '<section class="dua-page">' + topDuaV1(title,"#/duas") + '<div class="dua-special-grid">' + duaCategoriesV1.map(function (c) {
      return '<a href="#/dua-category/' + c.slug + '" class="dua-category-card">' + artDuaV1(c.art,c.icon) + '<div class="dua-category-copy"><h3>' + escapeDuaV1(c.title) + '</h3><p>' + c.chapters.length + ' chapters</p></div></a>';
    }).join("") + '</div>' + navDuaV1("duas") + '</section>';
    return '<section class="dua-page dua-special-page">' + topDuaV1(title,"#/duas") + '<p class="dua-list-intro">' + (mode==="bookmarks" ? "Your saved supplications stay in this browser." : mode==="recents" ? "Continue with supplications you opened recently." : "A curated starter selection of everyday remembrance.") + '</p>' +
      (list.length ? '<div class="dua-chapter-list">' + list.map(function(e) {
        return '<div class="dua-list-row dua-entry-row"><a class="dua-entry-open" href="#/dua-detail/' + e.id + '/' + e.chapter + '"><span class="dua-row-book">▤</span><span class="dua-row-copy"><strong>' + escapeDuaV1(e.title) + '</strong><small>' + escapeDuaV1(e.reference) + '</small></span><span class="dua-row-arrow">→</span></a>' + (mode==="bookmarks" ? '<button class="dua-small-bookmark is-saved" data-act="bm" data-k="d:' + e.id + '" aria-label="Remove bookmark">★</button>' : '') + '</div>';
      }).join("") + '</div>' : '<div class="dua-empty-state"><span>☾</span><h2>' + (mode==="bookmarks" ? "No saved duas yet" : mode==="recents" ? "Nothing viewed yet" : "No supplications found") + '</h2><p>Open any supplication and tap the star to save it here for later.</p><a class="dua-primary-cta" href="#/duas">Explore Duas</a></div>') + navDuaV1(mode==="bookmarks" ? "saved" : "duas") + '</section>';
  }
  function updateDuaSearchV1() {
    var input = document.getElementById("dua-search"), box = document.getElementById("dua-search-results"), clear = document.getElementById("dua-clear-search");
    if (!input || !box || !clear) return;
    var q = input.value.trim().toLowerCase();
    clear.hidden = !q; box.hidden = !q;
    if (!q) { box.innerHTML = ""; return; }
    var cats = duaCategoriesV1.filter(function(c) { return (c.title + " " + c.subtitle + " " + c.group).toLowerCase().indexOf(q) >= 0; });
    var found = duaEntriesV1.filter(function(e) { return (e.title + " " + e.transliteration + " " + e.translation + " " + e.occasion + " " + e.reference).toLowerCase().indexOf(q) >= 0; }).slice(0,12);
    box.innerHTML = (cats.length ? '<p class="dua-search-label">Collections</p>' + cats.map(function(c) { return '<a href="#/dua-category/' + c.slug + '" class="dua-search-result"><span>▤</span><span><strong>' + escapeDuaV1(c.title) + '</strong><small>' + c.chapters.length + ' chapters</small></span><b>→</b></a>'; }).join("") : "") +
      (found.length ? '<p class="dua-search-label">Supplications</p>' + found.map(function(e) { return '<a href="#/dua-detail/' + e.id + '/' + e.chapter + '" class="dua-search-result"><span>۞</span><span><strong>' + escapeDuaV1(e.title) + '</strong><small>' + escapeDuaV1(e.reference) + '</small></span><b>→</b></a>'; }).join("") : "") +
      (!cats.length && !found.length ? '<p class="dua-empty-search">No matches. Try “sleep”, “travel”, “parents”, or “forgiveness”.</p>' : "");
  }
  function duaRoutePartsV1() {
    if (location.hash && location.hash.indexOf("#/") === 0) return location.hash.slice(2).split("/").filter(Boolean).map(function (part) { try{return decodeURIComponent(part)}catch(_){return part} });
    return ["duas"];
  }
  function isDuaRouteV1(hash) {
    var route = (hash || "").indexOf("#/") === 0 ? (hash.slice(2).split("/")[0] || "") : "";
    return ["duas","dua-category","dua-chapter","dua-detail","dua-special"].indexOf(route) >= 0;
  }
  function renderDuaV1() {
    var parts = duaRoutePartsV1(), route = parts[0] || "duas", view = document.getElementById("view");
    if (!view) return;
    document.body.classList.add("dua-app-mode");
    document.body.dataset.route = route;
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    var html;
    if (route === "duas") html = duaLandingViewV1();
    else if (route === "dua-category") html = duaCategoryViewV1(parts[1]);
    else if (route === "dua-chapter") html = duaChapterViewV1(parts[1]);
    else if (route === "dua-detail") html = duaDetailViewV1(parts[1],parts[2]);
    else html = duaSpecialViewV1(parts[1] || "bookmarks");
    view.innerHTML = html;
  }
  function notifyDuaV1(message) {
    if (typeof window.toast === "function") window.toast(message);
  }
  function navigateOutDuaV1(target) {
    var map = {home:"home",quran:"quran",tasbih:"tasbeeh",namaz:"prayers",bookmarks:"journey"};
    target = map[target] || "home";
    document.body.classList.remove("dua-app-mode");
    if (location.hash && location.hash.indexOf("#/") === 0) history.replaceState(null,"",location.pathname + location.search);
    page = target;
    baseGoDuaV1(target);
  }
  var baseRenderDuaV1 = window.render;
  var baseGoDuaV1 = window.go;
  window.duasPage = function () { return duaLandingViewV1(); };
  window.render = function () {
    if (page === "duas" || isDuaRouteV1(location.hash)) {
      page = "duas";
      renderDuaV1();
      return;
    }
    document.body.classList.remove("dua-app-mode");
    return baseRenderDuaV1.apply(this, arguments);
  };
  window.go = function (target) {
    if (target === "duas") {
      page = "duas";
      if (location.hash !== "#/duas") location.hash = "#/duas";
      renderDuaV1();
      window.scrollTo(0,0);
      return;
    }
    if (document.body.classList.contains("dua-app-mode")) {
      document.body.classList.remove("dua-app-mode");
      if (location.hash && location.hash.indexOf("#/") === 0) history.replaceState(null,"",location.pathname + location.search);
    }
    return baseGoDuaV1.apply(this, arguments);
  };
  window.addEventListener("hashchange", function () {
    if (isDuaRouteV1(location.hash)) {
      page = "duas";
      renderDuaV1();
      window.scrollTo(0,0);
      return;
    }
    if (document.body.classList.contains("dua-app-mode") && location.hash && location.hash.indexOf("#/") === 0) {
      var route = location.hash.slice(2).split("/")[0];
      navigateOutDuaV1(route);
    }
  });
  document.addEventListener("click", function (event) {
    if (!document.body.classList.contains("dua-app-mode")) return;
    var button = event.target.closest("[data-act]");
    if (!button) return;
    var action = button.dataset.act;
    if (action === "dua-clear-search") {
      var input = document.getElementById("dua-search"); if (input) { input.value = ""; updateDuaSearchV1(); input.focus(); }
    } else if (action === "bm") {
      var key = button.dataset.k || "";
      duaStateV1.bookmarks = savedDuaV1(key.slice(2)) ? duaStateV1.bookmarks.filter(function (v) { return v !== key; }) : duaStateV1.bookmarks.concat([key]);
      persistDuaV1(); renderDuaV1();
    } else if (action === "dua-settings") {
      var panel = document.getElementById("dua-settings-panel"); if (panel) panel.hidden = !panel.hidden;
    } else if (action === "dua-settings-close") {
      var panelClose = document.getElementById("dua-settings-panel"); if (panelClose) panelClose.hidden = true;
    } else if (action === "dua-more") {
      var more = document.getElementById("dua-more-menu"); if (more) more.hidden = !more.hidden;
    } else if (action === "dua-font") {
      duaStateV1.arabicSize = Math.max(22, Math.min(50, duaStateV1.arabicSize + (Number(button.dataset.d) || 0)));
      persistDuaV1(); renderDuaV1();
    } else if (action === "dua-read") {
      var id = button.dataset.id;
      duaStateV1.read = markDuaV1(id) ? duaStateV1.read.filter(function (v) { return v !== id; }) : duaStateV1.read.concat([id]);
      persistDuaV1(); renderDuaV1();
    } else if (action === "dua-copy" || action === "dua-share") {
      var item = itemDuaV1(button.dataset.id);
      if (item) {
        var content = item.title + "\n\n" + item.arabic + "\n" + item.transliteration + "\n" + item.translation + "\n\n" + item.reference + "\n" + item.sourceUrl;
        if (action === "dua-share" && navigator.share) navigator.share({title:item.title,text:content,url:item.sourceUrl || location.href}).catch(function(){});
        else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(content).then(function(){notifyDuaV1("Supplication copied")}).catch(function(){window.prompt("Copy this supplication",content)});
        else window.prompt("Copy this supplication",content);
      }
    } else if (action === "dua-share-category") {
      var category = categoryDuaV1(button.dataset.slug);
      if (category) {
        var text = category.title + "\n" + category.subtitle;
        if (navigator.share) navigator.share({title:category.title,text:text,url:location.href}).catch(function(){});
        else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(function(){notifyDuaV1("Link copied")}).catch(function(){});
      }
    }
  });
  document.addEventListener("input", function(event) {
    if (document.body.classList.contains("dua-app-mode") && event.target && event.target.id === "dua-search") updateDuaSearchV1();
  });
  document.addEventListener("change", function(event) {
    var input = event.target;
    if (!document.body.classList.contains("dua-app-mode") || !input.matches("[data-act=dua-text-toggle]")) return;
    duaStateV1.visible[input.dataset.l] = input.checked;
    persistDuaV1(); renderDuaV1();
  });
  if (isDuaRouteV1(location.hash)) {
    page = "duas";
    renderDuaV1();
  }

})();
