export type Source = {
  id: string;
  title: string;
  creator: string;
  date: string;
  kind: string;
  description: string;
  location: string;
  url?: string;
  method?: string;
};

export const sources: Source[] = [
  {
    id: "bladt",
    title: "Aalborg Karneval: Gaden er scenen – du er gøgleren!",
    creator: "Inger Kirstine Bladt, museumsinspektør",
    date: "Den Korte Historie, nr. 5, s. 13–20",
    kind: "Historisk artikel",
    description: "Historisk fremstilling af Aalborg Karnevals begyndelse og udvikling. Artiklen citerer blandt andet Bramwell Flyckt og krediterer foto til Aalborg Karneval.",
    location: "Digital udgave hos tidsskrift.dk; kopi modtaget som PDF i projektmaterialet.",
    url: "https://tidsskrift.dk/denkortehistorie/article/download/162255/203875/360365",
  },
  {
    id: "poster",
    title: "Aalborg Karneval plakat 1983",
    creator: "Aalborg Stadsarkiv",
    date: "1983 · dateret 28. maj",
    kind: "Arkivgenstand",
    description: "Arkivregistrering af den første plakat. Beskrivelsen angiver trykte layout- og produktionskreditter: “Bramwell, Nick & Kirsten”.",
    location: "Arkiv.dk, registreringsnr. P76",
    url: "https://arkiv.dk/vis/7208947",
  },
  {
    id: "official-history",
    title: "Aalborg Karnevals historie",
    creator: "Foreningen Aalborg Karneval",
    date: "Løbende opdateret webside · tilgået 13. oktober 2026",
    kind: "Officiel webkilde",
    description: "Foreningens oversigt over karnevalsplakater, konger og dronninger samt temaer gennem årene. Bruges som arrangørens egen historiske oversigt.",
    location: "aalborgkarneval.dk",
    url: "https://aalborgkarneval.dk/aalborg-karnevals-historie/",
  },
  {
    id: "bylaws",
    title: "Vedtægter for Foreningen Aalborg Karneval",
    creator: "Foreningen Aalborg Karneval",
    date: "18. marts 2026",
    kind: "Organisationsdokument",
    description: "Foreningens vedtagne formål og organisatoriske ramme. Formålet nævner karnevalets traditioner, historie, musik, lokale forskelligheder, børns og unges folkekulturelle aktiviteter og støtte til Aalborgs kulturliv.",
    location: "aalborgkarneval.dk",
    url: "https://aalborgkarneval.dk/vedtaegter-for-foreningen-aalborg-karneval/",
  },
  {
    id: "adult-2026",
    title: "Aalborg Karneval 2026 · Hovedresultater fra årets gæsteevaluering",
    creator: "Silverlining for Aalborg Karneval",
    date: "Juli 2026",
    kind: "Gæsteundersøgelse",
    description: "Undersøgelse af gæster med armbånd til Kildeparken. Rapporten oplyser 3.345 besvarelser i alt; enkelte analyser anvender n=3.314. Den er indsamlet digitalt via e-mail.",
    location: "PDF modtaget i projektmaterialet · Aalborg Karneval 2026 – Gæsteundersøgelse",
    method: "Selvselekterede svar fra armbåndsgæster via e-mail. Rapporten ændrer svarskala på flere spørgsmål ift. 2025 og omregner tidligere svar til sammenligning.",
  },
  {
    id: "comparison-2026",
    title: "Aalborg Karneval 2026 · Sammenlignende gæsteundersøgelse",
    creator: "Silverlining for Aalborg Karneval",
    date: "Juli 2026",
    kind: "Gæsteundersøgelse",
    description: "Sammenstiller voksenkarnevallet, Børnekarnevallet og Gløden på tværs af tilfredshed, anbefaling, kendskab og demografi.",
    location: "PDF modtaget i projektmaterialet · Aalborg Karneval 2026 – Sammenlignende",
    method: "Rapporten oplyser 3.345 besvarelser fra voksenkarnevallet, 226 fra Børnekarnevallet og 294 fra Gløden. Tilfredshedstabellen bruger n=3.314 for voksenkarnevallet. Forfatteren anbefaler forbehold ved mindre stikprøver.",
  },
  {
    id: "children-2026",
    title: "Aalborg Børnekarneval 2026 · Gæsteundersøgelse",
    creator: "Silverlining for Aalborg Karneval",
    date: "Juli 2026",
    kind: "Gæsteundersøgelse",
    description: "Forældrebesvarelser om både de voksnes og børnenes oplevelse. Rapporten beskriver regnvejr som en tydelig faktor i årets vurderinger.",
    location: "PDF modtaget i projektmaterialet · Aalborg Børnekarneval 2026 – Gæsteundersøgelse",
    method: "Digitalt spørgeskema sendt til billetkøbere via e-mail og suppleret med QR-koder på dagen. 226 besvarelser i den sammenlignende rapport.",
  },
  {
    id: "gloden-2026",
    title: "Gløden 2026 · Gæsteundersøgelse",
    creator: "Silverlining for Aalborg Karneval",
    date: "Juli 2026",
    kind: "Gæsteundersøgelse",
    description: "Evaluering af koncertoplevelsen Gløden 2026. Rapporten er det første sammenligningsgrundlag for fremtidige gæsteundersøgelser af Gløden.",
    location: "PDF modtaget i projektmaterialet · Gløden 2026 – Gæsteundersøgelse",
    method: "E-mail og QR-koder. Seks svar fra personer, som havde kombibillet uden at have deltaget i Gløden, er frasorteret. n=294 i den sammenlignende rapport.",
  },
];

export type Article = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  updated: string;
  sources: string[];
  sections: { heading: string; paragraphs: string[]; points?: string[]; note?: string }[];
  reading: string;
};

export const articles: Article[] = [
  {
    slug: "begyndelsen-1983",
    title: "Det første Aalborg Karneval",
    category: "Historie",
    summary: "Et optog gennem Aalborgs midtby den 28. maj 1983 blev begyndelsen på en tilbagevendende tradition.",
    updated: "Kildegrundlag: historisk artikel og arkivregistrering",
    sources: ["bladt", "poster"],
    reading: "5 min",
    sections: [
      {
        heading: "En ny tradition tager form",
        paragraphs: [
          "Aalborg Karnevals begyndelse placeres lørdag den 28. maj 1983. Museumsinspektør Inger Kirstine Bladts historiske artikel beskriver, hvordan omkring 20 bybusser stod på Nytorv, mens udklædte børn, unge og voksne gik og dansede gennem bymidten.",
          "Artiklen anslår optoget til omkring 10.000 deltagere. Tallet skal læses som et historisk skøn gengivet i artiklen, ikke som en optælling med kendt metode."
        ],
        points: ["Dato: 28. maj 1983", "Sted: Aalborgs midtby", "Anslået deltagerantal: ca. 10.000"]
      },
      {
        heading: "Karneval blev gjort sammen",
        paragraphs: [
          "Forberedelserne omfattede undervisning i streetsamba ved Den Rytmiske Aftenskole og et ugentligt karnevalsværksted, hvor deltagere kunne sy dragter og lave masker og rasleinstrumenter. Artiklen beskriver derfor ikke kun en parade, men også et forarbejde med læring og praktisk deltagelse.",
          "Aalborg Stadsarkivs registrering af plakaten fra 1983 giver et samtidigt fysisk spor efter begivenheden. Registreringen daterer plakaten til 28. maj og identificerer den som plakat for det første karneval under navnet Aalborg Karneval/Karneval i Aalborg."
        ],
        note: "Historikteksten er en sekundær kilde. Arkivposten er en registrering af en konkret genstand; den dokumenterer plakaten, ikke i sig selv hele arrangementets størrelse eller oplevelse."
      },
      {
        heading: "Det første år var også et eksperiment",
        paragraphs: [
          "Bladt gengiver både deltagernes entusiasme og praktiske problemer: blandt andet oprydning, affaldsspande og utilstrækkelige offentlige toiletter. Artiklen oplyser desuden, at der var enighed om at fortsætte i 1984.",
          "De tidlige beskrivelser peger på en tradition, der voksede frem gennem frivillig indsats, fælles forberedelser og brug af byens gader. Det er en foreløbig læsning af de kilder, der er registreret her; flere samtidige avisartikler, foreningspapirer og mundtlige erindringer kan nuancere den."
        ],
        note: "Foreløbig fortolkning: deltagelse og fælles skabelse ser ud til at være centrale spor fra begyndelsen. Det er en arbejdshypotese, ikke en endelig beskrivelse af karnevallets sjæl."
      }
    ]
  },
  {
    slug: "initiativtagere-og-faellesskab",
    title: "Initiativtagere og fælles forberedelser",
    category: "Mennesker",
    summary: "Hvad de første kilder faktisk fortæller om personerne, værkstederne og drivkraften bag starten.",
    updated: "Kildegrundlag: historisk artikel og Aalborg Stadsarkivs plakatpost",
    sources: ["bladt", "poster"],
    reading: "4 min",
    sections: [
      {
        heading: "Et navn, vi kan dokumentere",
        paragraphs: [
          "Inger Kirstine Bladts artikel omtaler Bramwell Flyckt som en af initiativtagerne til Aalborg Karneval. Artiklen gengiver en udtalelse, han gav til Kristeligt Dagblad i 2013, hvor han knytter initiativet til et ønske om at sige ja til livet gennem dans og kropsudfoldelse.",
          "Aalborg Stadsarkivs registrering af 1983-plakaten oplyser, at layout og produktion er krediteret “Bramwell, Nick & Kirsten”. Det er et spor om plakatens tilblivelse. Kilden fastslår ikke i sig selv, at alle tre var initiativtagere."
        ],
        points: ["Bramwell Flyckt er direkte nævnt som initiativtager i historikartiklen.", "Nick og Kirsten står i arkivposten som krediteret for layout og produktion af plakaten."],
        note: "Citatet fra 2013 er her kendt gennem Bladts artikel, ikke gennem det oprindelige interview. Den fulde kreditering og identiteten på “Nick & Kirsten” bør efterprøves i originalmateriale."
      },
      {
        heading: "Fællesskab før festdag",
        paragraphs: [
          "Historikartiklen fortæller, at frivillige bidrog til at få det første karneval op at stå. Streetsamba-undervisning og onsdagsværksteder gav plads til at øve, sy kostumer og fremstille masker og instrumenter før optoget.",
          "Det giver et konkret udgangspunkt for videre research i, hvem der organiserede undervisningen og værkstedet, hvilke foreninger der deltog, og hvordan ideen blev forankret i byen."
        ],
        note: "Navnelisten over initiativtagere er endnu ikke komplet. Vi bør ikke behandle de personer, der nævnes i én kilde, som en fuldstændig stifterkreds."
      }
    ]
  },
  {
    slug: "gaestedata-2026",
    title: "Hvad gæstesvarene fra 2026 viser",
    category: "Gæsteundersøgelser",
    summary: "Tilfredshed, anbefaling og oplevede flaskehalse blandt de gæster, der svarede på årets undersøgelse.",
    updated: "Kildegrundlag: gæsteundersøgelsen for Aalborg Karneval 2026",
    sources: ["adult-2026"],
    reading: "6 min",
    sections: [
      {
        heading: "Hvem indgår i materialet?",
        paragraphs: [
          "Rapporten oplyser 3.345 besvarelser indsamlet digitalt via e-mail blandt gæster med armbånd til Kildeparken. Den beskriver et større datasæt end undersøgelsen i 2025.",
          "Der er forskel på det samlede antal besvarelser og antallet i konkrete analyser: tilfredshedssammenligningen bruger n=3.314. I wiki’en bevarer vi derfor rapportens analysetal ved hvert enkelt resultat frem for at bruge ét samlet deltagerantal."
        ],
        note: "Svarene kommer fra armbåndsgæster, som valgte at besvare undersøgelsen. De kan ikke uden videre læses som repræsentative for alle, der deltog i Stjerneparaden eller besøgte byen."
      },
      {
        heading: "Høj tilfredshed og stærk anbefaling",
        paragraphs: [
          "Den gennemsnitlige tilfredshed med hele eventet er 8,3 ud af 10 i 2026 mod 8,0 i 2025. Rapporten angiver NPS 60. NPS måler anbefalingsvilje på en anden måde end gennemsnitlig tilfredshed, så de to tal beskriver forskellige sider af svarene.",
          "Rapporten fremhæver samtidig plads og trængsel i Kildeparken som det tydeligste kritikpunkt blandt 305 åbne kommentarer, der uddyber lave samlede tilfredshedsscorer. 62 % af kommentarerne i denne delanalyse nævner kapacitet eller trængsel."
        ],
        points: ["Tilfredshed: 8,3/10 (n=3.314 i sammenligningen)", "NPS: 60", "Åbne kommentarer om lave vurderinger: n=305; 62 % nævner kapacitet/trængsel"],
        note: "Kommentarandelene er kodede temaer i en udvalgt gruppe åbne kommentarer, ikke procentandele af alle gæster."
      },
      {
        heading: "Hvad materialet kan og ikke kan sige",
        paragraphs: [
          "Undersøgelsen viser, hvordan de svarende gæster vurderede bestemte dele af 2026-eventet. Den kan pege på styrker og friktioner, men besvarer ikke alene, hvad karnevallets sjæl er, eller hvordan oplevelsen ser ud for gæster, som ikke indgår i svarmaterialet.",
          "Metoden ændrede sig også på flere spørgsmål mellem 2025 og 2026: 2026-rapporten anvender en 1–5-skala på flere emner og omregner 2025-svar til sammenligningen. Det bør følge alle tidsserier, vi senere viser."
        ]
      }
    ]
  },
  {
    slug: "tre-events-tre-perspektiver",
    title: "Tre events, tre forskellige gæstebilleder",
    category: "Gæsteundersøgelser",
    summary: "Sammenligningsrapporten viser både fælles mønstre og forskelle mellem voksenkarnevallet, Børnekarnevallet og Gløden.",
    updated: "Kildegrundlag: sammenlignende gæsteundersøgelse 2026",
    sources: ["comparison-2026", "children-2026", "gloden-2026"],
    reading: "5 min",
    sections: [
      {
        heading: "Tilfredshed er ikke det samme som anbefaling",
        paragraphs: [
          "I sammenligningsrapportens tilfredshedsmåling ligger Gløden højest med 8,5/10, voksenkarnevallet på 8,3 og Børnekarnevallet på 7,6. På NPS ligger voksenkarnevallet højest med 60, fulgt af Børnekarnevallet med 56 og Gløden med 50.",
          "Det gør det tydeligt, hvorfor målene ikke bør blandes sammen: tilfredshed handler om vurderingen af årets event, mens NPS i rapporten beskrives som anbefalingsvilje."
        ],
        points: ["Voksenkarnevallet: 8,3 i tilfredshed · NPS 60", "Børnekarnevallet: 7,6 · NPS 56", "Gløden: 8,5 · NPS 50"]
      },
      {
        heading: "Svargrundlaget er forskelligt",
        paragraphs: [
          "Rapporten oplyser 3.345 besvarelser for voksenkarnevallet, 226 for Børnekarnevallet og 294 for Gløden. Tilfredshedstabellen anvender dog n=3.314 for voksenkarnevallet. Sammenligningerne for Børnekarnevallet og Gløden bygger på væsentligt færre svar og bør læses med større usikkerhed.",
          "Børnekarnevallets særskilte rapport oplyser, at spørgeskemaet blev besvaret af forældre og dækkede både forældrenes og børnenes oplevelse. Glødens rapport frasorterede seks respondenter, som havde købt kombibillet uden at have deltaget i koncerten."
        ],
        note: "Rapporterne bruger forskellige indsamlingsveje og målgrupper. Tallene er nyttige til at stille bedre spørgsmål, men ikke til ukritisk rangordning af events."
      },
      {
        heading: "Foreløbig læsning",
        paragraphs: [
          "De tre formater samles under samme arrangør, men svarene beskriver forskellige oplevelser og respondentgrupper. Det peger på, at undersøgelsen af “Sjælen af Karneval” bør rumme flere stemmer og ikke lade voksenkarnevallets store stikprøve definere hele organisationens identitet."
        ],
        note: "Dette er en arbejdshypotese afledt af datagrundlagets forskelle. Den bør afprøves i interviews, workshop og senere dataindsamling."
      }
    ]
  },
  {
    slug: "foreningens-formal",
    title: "Foreningens eget formål",
    category: "Organisation",
    summary: "Vedtægterne fra marts 2026 beskriver, hvordan foreningen selv formulerer sin kulturelle opgave.",
    updated: "Kildegrundlag: Foreningen Aalborg Karnevals vedtægter",
    sources: ["bylaws"],
    reading: "3 min",
    sections: [
      {
        heading: "Formålet i vedtægterne",
        paragraphs: [
          "Foreningens vedtægter fra 18. marts 2026 beskriver et formål om at udbrede kendskabet til karnevalets traditioner, historie, musik, universelle karakter og lokale forskelligheder. De nævner også rammer for børns og unges folkekulturelle aktiviteter samt støtte til Aalborgs brede kulturliv.",
          "Det er en primær kilde til foreningens formelle selvbeskrivelse. Den siger, hvad foreningen har vedtaget som formål, men ikke i sig selv, hvordan medarbejdere, frivillige, gæster eller byen oplever karnevallet."
        ],
        points: ["Traditioner, historie og musik", "Karnevallets universelle karakter og lokale forskelligheder", "Folkekulturel aktivitet for børn og unge", "Økonomiske muligheder for at støtte Aalborgs brede kulturliv"]
      },
      {
        heading: "Fra formål til levende praksis",
        paragraphs: [
          "Et næste researchspor er at sammenholde formålsparagrafferne med konkrete valg: hvordan programmer og parader udvikles, hvem der får mulighed for at deltage, hvordan frivillige inddrages, og hvor midlerne fra karnevallet går hen.",
          "På den måde kan wiki’en skelne mellem organisationens erklærede værdier og de erfaringer, som indsamles gennem spørgeskemaer, interviews og workshop."
        ],
        note: "Kilde: vedtægternes § 2. Formål er sammenfattet med egne ord; se den fulde ordlyd hos foreningen."
      }
    ]
  }
];
