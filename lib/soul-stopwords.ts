// Exact Danish stopwords only. Extend this list to adjust the transparent analysis.
// No stemming, lemmatization, inferred synonyms or semantic classification.
export const DANISH_STOPWORDS = new Set(`
ad af alle alt altid anden andet andre at bare begge blev blive bliver blot både
da dag de dem den denne dens der deres derfor derfra deri dermed derpå des det dette
dig din dine disse dit dog du efter eller ellers en end endnu ene eneste enhver er et
for foran fordi fra før først få får fik finde findes gennem gjorde gjort gør gøre
godt havde ham han hans har have havde hele heller helt hen hende hendes her hertil
hos hun hvad hvem hver hvilke hvilken hvilket hvis hvor hvordan hvorfor hvorfra hvortil
i igen ikke imellem ind inde inden ingen intet jeg jer jeres jo kan kom komme kommer
kun kunne lad lavet lige ligesom lidt mange man meget med mellem men mens mere mest
mig min mine mit mod må måske måtte ned nej noget nogen nogle nok nu når også og
om op os over på samme samt selv sig sin sine sit skal skulle som sådan så tager
thi til tilbage to tre ud uden under var ved vel vi vil ville vor vore vores være været
` .trim().split(/\s+/));
