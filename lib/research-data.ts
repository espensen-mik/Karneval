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

export const sources: Source[] = [];

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
