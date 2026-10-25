// Catálogo fijo: categorías, piezas, alérgenos, colores y temas.
// Coste = ingredientes por pieza con precios de mayorista de 2026
// (salmón en filete ~15 €/kg, atún ~22 €/kg, arroz ~2 €/kg, pollo ~6 €/kg).
// No incluye mano de obra, local ni energía.

export const CATS = [
  {id:'nigiri', name:'Nigiri y sashimi', short:'Nigiri', plate:'#E5484D'},
  {id:'roll', name:'Rolls', short:'Rolls', plate:'#3E7BFA'},
  {id:'hot', name:'Calientes', short:'Calientes', plate:'#F5A524'},
  {id:'side', name:'Entrantes', short:'Entrantes', plate:'#30A46C'},
  {id:'dessert', name:'Postres', short:'Postres', plate:'#E879B5'},
];

export const ALLERGENS = [
  {id:'gluten', name:'Gluten'}, {id:'crustaceos', name:'Crustáceos'}, {id:'moluscos', name:'Moluscos'},
  {id:'pescado', name:'Pescado'}, {id:'huevo', name:'Huevo'}, {id:'lacteos', name:'Lácteos'},
  {id:'soja', name:'Soja'}, {id:'sesamo', name:'Sésamo'}, {id:'cacahuete', name:'Cacahuete'},
];

// id, nombre, categoría, kcal, coste, precio en carta, unidad, [proteínas, hidratos, grasas] en gramos, alérgenos
const T = (id, name, cat, kcal, cost, carta, unit, mac, al) =>
  ({id, name, cat, kcal, cost, carta, unit, mac, al, on:true, fav:false});

export const DEFAULT_TYPES = [
  T('nigiri','Nigiri salmón','nigiri',60,.24,2.5,'pieza',[3.5,8,1.6],['pescado']),
  T('nigiri_atun','Nigiri atún','nigiri',55,.30,3,'pieza',[4.5,8,.4],['pescado']),
  T('nigiri_anguila','Nigiri anguila','nigiri',75,.36,3.2,'pieza',[3.5,10,2.3],['pescado','soja','gluten','sesamo']),
  T('ebi','Ebi nigiri','nigiri',50,.18,2.5,'pieza',[3,8,.6],['crustaceos']),
  T('sashimi','Sashimi salmón','nigiri',35,.25,2.2,'lámina',[3,0,2.5],['pescado']),
  T('sashimi_atun','Sashimi atún','nigiri',30,.32,2.6,'lámina',[6.5,0,.4],['pescado']),
  T('tataki','Tataki atún','nigiri',45,.30,3,'pieza',[7,1,1.4],['pescado','sesamo','soja','gluten']),
  T('gunkan','Gunkan','nigiri',55,.22,3,'pieza',[3,8,1.2],['pescado']),
  T('maki','Maki','roll',35,.09,1.1,'pieza',[1.4,6.5,.3],['pescado']),
  T('uramaki','Uramaki','roll',50,.13,1.5,'pieza',[1.8,7,1.6],['pescado','sesamo','lacteos']),
  T('california','California','roll',50,.12,1.5,'pieza',[1.6,7.5,1.4],['pescado','crustaceos','huevo','gluten']),
  T('futomaki','Futomaki','roll',70,.16,1.6,'pieza',[2.4,11,1.8],['huevo','pescado','gluten','soja']),
  T('dragon','Dragon roll','roll',75,.22,2,'pieza',[2.6,9,3.2],['crustaceos','gluten','huevo','pescado','sesamo','soja']),
  T('temaki','Temaki','roll',180,.45,5.5,'cono',[8,25,5.2],['pescado','sesamo','huevo']),
  T('gyoza','Gyoza','hot',45,.08,1.4,'pieza',[2,5,1.9],['gluten','soja','sesamo']),
  T('tempura','Tempura langostino','hot',90,.28,2,'pieza',[4,8,4.6],['crustaceos','gluten','huevo']),
  T('pollo_teriyaki','Pollo teriyaki','hot',140,.30,3.5,'brocheta',[14,8,5.8],['soja','gluten','sesamo']),
  T('karaage','Pollo karaage','hot',80,.12,1.3,'pieza',[6,4,4.4],['gluten','soja','huevo']),
  T('pato','Pato pekín','hot',160,.55,3.5,'crep',[9,14,7.6],['gluten','soja','sesamo']),
  T('rollito','Rollito primavera','hot',110,.10,1.5,'pieza',[3,12,5.6],['gluten','soja']),
  T('bao','Bao','hot',230,.38,4.5,'pieza',[9,28,9.2],['gluten','soja','cacahuete']),
  T('takoyaki','Takoyaki','hot',60,.10,1.2,'bola',[2.4,6,2.9],['moluscos','gluten','huevo','pescado','soja']),
  T('yakisoba','Yakisoba','hot',380,.35,8,'plato',[12,55,12.4],['gluten','soja','huevo']),
  T('arroz_frito','Arroz frito','hot',330,.25,6,'plato',[9,50,10.2],['huevo','soja','gluten']),
  T('miso','Sopa miso','side',60,.15,3.5,'bol',[4,6,2.2],['soja','pescado']),
  T('edamame','Edamame','side',120,.28,4.5,'ración',[11,9,5],['soja']),
  T('wakame','Wakame','side',70,.30,5,'ración',[1.5,9,3.2],['sesamo','soja']),
  T('onigiri','Onigiri','side',175,.30,2.5,'pieza',[4,36,1.5],['pescado','sesamo']),
  T('mochi','Mochi','dessert',95,.40,2.5,'pieza',[1.2,18,2.2],['lacteos']),
  T('helado','Helado','dessert',140,.25,3,'copa',[2.5,17,7],['lacteos','huevo']),
  T('fruta','Fruta','dessert',60,.20,3.5,'ración',[.6,14,.2],[]),
];
export const ORDER = Object.fromEntries(DEFAULT_TYPES.map((t, i) => [t.id, i]));
export const OLD_NAMES = {nigiri:'Nigiri', sashimi:'Sashimi', tempura:'Tempura'};
export const BIG_UNITS = ['plato','bol','ración','copa','cono','crep','brocheta'];

// Plantillas para piezas personalizadas
export const TEMPLATES = [
  {id:'nigiri', name:'Nigiri'}, {id:'sashimi', name:'Sashimi'}, {id:'maki', name:'Maki'}, {id:'gunkan', name:'Gunkan'},
  {id:'brocheta', name:'Brocheta'}, {id:'bol', name:'Bol'}, {id:'bola', name:'Postre'}, {id:'roll', name:'Roll'},
];
export const FOOD_COLORS = [
  {c:'#FF7F5C', n:'Salmón'}, {c:'#D7374A', n:'Atún'}, {c:'#F4E9D8', n:'Pescado blanco'}, {c:'#FFD84A', n:'Tamago'},
  {c:'#93C252', n:'Aguacate'}, {c:'#FF8A1F', n:'Huevas'}, {c:'#8E4B22', n:'Anguila'}, {c:'#F6A6B8', n:'Fresa'},
  {c:'#9A7BD8', n:'Ube'}, {c:'#C8803A', n:'Frito'},
];

export const DINER_COLORS = ['#FA5D3C','#0A84FF','#30B0C7','#AF52DE','#FF9F0A','#34C759','#FF2D55','#5E5CE6','#A2845E'];
export const ACCENTS = [
  {id:'sake', name:'Sake', m:'salmón', c:'#FA5D3C'}, {id:'maguro', name:'Maguro', m:'atún', c:'#E0313F'},
  {id:'uni', name:'Uni', m:'erizo', c:'#EE9B00'}, {id:'wasabi', name:'Wasabi', m:'rábano picante', c:'#4FA232'},
  {id:'matcha', name:'Matcha', m:'té verde', c:'#249478'}, {id:'ao', name:'Ao', m:'azul', c:'#0A84FF'},
  {id:'murasaki', name:'Murasaki', m:'morado', c:'#7D5BF0'}, {id:'sakura', name:'Sakura', m:'cerezo', c:'#EC4F8A'},
];
export const SKINS = [
  {id:'ios', name:'iOS', d:'Claro u oscuro, como el sistema'},
  {id:'neon', name:'Tokio de noche', d:'Neón sobre fondo oscuro', mode:'dark'},
  {id:'washi', name:'Madera y papel', d:'Papel japonés y bermellón', mode:'light'},
  {id:'minimal', name:'Minimal', d:'Plano, sin sombras ni adornos'},
];
export const CURRENCIES = {EUR:'€', USD:'$', GBP:'£'};
export const PRICE_SLOTS = [
  {id:'noon', name:'Mediodía', d:'Lunes a viernes antes de las 17:00'},
  {id:'night', name:'Noche', d:'Lunes a viernes desde las 17:00'},
  {id:'weekend', name:'Fin de semana', d:'Sábados y domingos'},
];
