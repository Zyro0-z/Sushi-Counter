import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMenu, findMenuLinks, menuType, classify} from '../js/menu.js';

const WEB = `Title: Sakura Buffet
URL Source: https://sakura.example/carta
Markdown Content:
# Carta Buffet Libre

Mediodía de lunes a viernes 15,95 €
Noches, fines de semana y festivos 19,95 €
Niños menores de 120 cm 10,95 €

## NIGIRIS (2 uds)
* N1. Nigiri de salmón
* N2. Nigiri de salmón flambeado
* N3. Nigiri de atún
* N4. Nigiri de pez mantequilla con trufa
* N5. Nigiri de langostino
* N6. Nigiri de anguila

## MAKIS
- Maki de salmón (6u)
- Maki de pepino
- Maki frito de salmón con queso (8u)

## URAMAKIS
| Uramaki California (8u) | Uramaki de salmón y aguacate (8u) |
| --- | --- |
| Uramaki crujiente: langostino en tempura, aguacate y salsa spicy | Uramaki Salmón Flameado (8u) |

## ENTRANTES
Sopa de miso
Gyozas de pollo a la plancha
Edamame
Ensalada de algas wakame
Rollitos de primavera

## PLATOS CALIENTES
Tallarines salteados con verduras
Arroz tres delicias
Pollo teriyaki
Pato pekín con salsa hoisin
Ternera con cebolla

## POSTRES
Mochi de té verde
Helado frito
Tarta de queso

## BEBIDAS
Coca-Cola
Té verde

Reservas: 91 123 45 67 · Horario: de 13:00 a 16:00
[Política de privacidad](/privacidad) [Ver carta en PDF](/carta.pdf) [Reservar](/reservas)`;

const OCR = `SUSHI HE
1 NIGIRI SALMON FLAMEADO 2 UDS 3,50
2 NIGIRI ATUN 2 UDS 3,80
15 HOSOMAKI DE PEPINO 6 PZS 2,90
16 URAMAKI SPICY TUNA 8 PZS 7,50
40 GYOZA DE TERNERA 4,20
TEMAKI DE SALMON 4,50
BEBIDAS
COCA COLA 2,20
CERVEZA 2,50`;

const byName = (items, n) => items.find(i => i.name === n);

test('lee una carta web con secciones, detalles y precios del buffet', () => {
  const {items, prices} = parseMenu(WEB);
  const names = items.map(i => i.name);
  assert.equal(items.length, 26, names.join(' | '));
  assert.ok(!names.includes('Té verde') && !names.some(n => /coca/i.test(n)), 'sin bebidas');
  assert.deepEqual(prices, {noon:15.95, night:19.95, weekend:19.95});
  const fl = byName(items, 'Nigiri de salmón flambeado');
  assert.equal(fl.base, 'nigiri'); assert.deepEqual(fl.mods, ['flame']); assert.equal(fl.sec, 'Nigiris');
  const pm = byName(items, 'Nigiri de pez mantequilla con trufa');
  assert.equal(pm.base, 'nigiri_x'); assert.equal(pm.tpl, 'nigiri'); assert.ok(pm.mods.includes('truffle'));
  assert.equal(byName(items, 'Nigiri de atún').base, 'nigiri_atun');
  assert.equal(byName(items, 'Nigiri de langostino').base, 'ebi');
  const mf = byName(items, 'Maki frito de salmón con queso');
  assert.equal(mf.cat, 'roll'); assert.deepEqual(mf.mods, ['crispy', 'cheese']); assert.equal(mf.pieces, 8);
  const uc = byName(items, 'Uramaki crujiente');
  assert.equal(uc.prot, 'langostino'); assert.equal(uc.tpl, 'uramaki'); assert.ok(uc.mods.includes('spicy') && uc.mods.includes('crispy'));
  assert.equal(byName(items, 'Uramaki California').like, 'california');
  assert.equal(byName(items, 'Uramaki salmón flameado').mods[0], 'flame');
  assert.equal(byName(items, 'Gyozas de pollo a la plancha').cat, 'side');
  assert.equal(byName(items, 'Tallarines salteados con verduras').like, 'yakisoba');
  assert.equal(byName(items, 'Ternera con cebolla').like, 'carne');
  assert.equal(byName(items, 'Tarta de queso').cat, 'dessert');
  assert.equal(byName(items, 'Helado frito').mods[0], 'crispy');
  assert.equal(byName(items, 'Pato Pekín con salsa hoisin').sec, 'Platos calientes');
});

test('lee una foto de carta en mayúsculas con códigos y precios', () => {
  const {items} = parseMenu(OCR);
  assert.deepEqual(items.map(i => i.name), ['Nigiri salmon flameado', 'Nigiri atun', 'Hosomaki de pepino', 'Uramaki spicy tuna', 'Gyoza de ternera', 'Temaki de salmon']);
  const t = menuType(items[0], 'b1', 0);
  assert.equal(t.carta, 1.75); assert.equal(t.menu, 'b1'); assert.ok(t.mods.includes('flame'));
  const tuna = items[3]; assert.equal(tuna.prot, 'atun'); assert.equal(tuna.tpl, 'uramaki');
});

test('encuentra el enlace a la carta y descarta reservas y privacidad', () => {
  assert.deepEqual(findMenuLinks(WEB, 'https://sakura.example/'), ['https://sakura.example/carta.pdf']);
});

test('ajusta calorías, coste y alérgenos según los detalles', () => {
  const it = classify('Maki frito de pollo con queso');
  const t = menuType({...it, name:'Maki frito de pollo con queso', sec:'Makis', price:null, pieces:null, desc:''}, 'b2', 3);
  assert.ok(t.kcal > 35 + 50); assert.ok(t.al.includes('lacteos') && t.al.includes('gluten')); assert.ok(!t.al.includes('pescado'));
});
