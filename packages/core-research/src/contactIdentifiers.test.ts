import { describe, expect, it } from 'vitest';

import {
  containsAnyContactIdentifier,
  containsPersonalContactIdentifier,
  detectContactIdentifiers,
  type ContactIdentifierKind,
} from './contactIdentifiers';

// K1 detector tests (CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md §10).
// Fixture website: W = example.com (https://www.example.com) unless stated otherwise.

const W = 'https://www.example.com';

function kinds(text: string, website: string | null = W): readonly ContactIdentifierKind[] {
  return detectContactIdentifiers(text, website);
}

function expectKinds(text: string, expected: ContactIdentifierKind[], website: string | null = W) {
  expect([...kinds(text, website)].sort()).toEqual([...expected].sort());
}

describe('§10.1 masking and formatting', () => {
  it('MK1 partially masked, fused x -> FRAGMENT', () => {
    expectKinds('98765 43XXX', ['FRAGMENT']);
  });
  it('MK2 spaced x group; core 7 -> FRAGMENT', () => {
    expectKinds('+91 98765 XXXXX', ['FRAGMENT']);
  });
  it('MK4 fully masked, no digits -> []', () => {
    expectKinds('XXXXX-XXXXX', []);
  });
  it('MK7 edge */• typography -> PHONE', () => {
    expectKinds('98765 43***', ['PHONE']);
    expectKinds('98765 43•••', ['PHONE']);
  });
  it('MK8 emphasis pair -> PHONE', () => {
    expectKinds('**9876543210**', ['PHONE']);
  });
  it('MK13/MK14 tight gap masks -> FRAGMENT', () => {
    expectKinds('98765-XXXXX', ['FRAGMENT']);
    expectKinds('98765 XXXXX', ['FRAGMENT']);
  });
  it('MK15 (Δ rev. 4) core 10 -> PHONE', () => {
    expectKinds('98765 43210 XXXXX', ['PHONE']);
  });
  it('MK16 core 10 -> PHONE', () => {
    expectKinds('9876543210 XXXXXX', ['PHONE']);
  });
  it('MK17 separate stretches', () => {
    expectKinds('98XXX XX210 or 98765 43210', ['FRAGMENT', 'PHONE']);
  });
  it('MK18 spaced both sides -> typography -> PHONE', () => {
    expectKinds('98765 ** 43210', ['PHONE']);
  });
  it('MK21 loose gap -> PHONE, FRAGMENT', () => {
    expectKinds('98765 43210 / 98XXX XXXXX', ['PHONE', 'FRAGMENT']);
  });
  it('MK22 loose gap -> PHONE, FRAGMENT', () => {
    expectKinds('555-0100, 555-01XX', ['PHONE', 'FRAGMENT']);
  });
  it('MK28 genuine masks -> FRAGMENT', () => {
    expectKinds('+91 98765 432XX', ['FRAGMENT']);
    expectKinds('(555) XXX-0199', ['FRAGMENT']);
  });
  it('MK29 tight detached mask, P=11 -> FRAGMENT', () => {
    expectKinds('555-0100 XXXX', ['FRAGMENT']);
  });
  it('MK30 P=17 -> U4 -> PHONE', () => {
    expectKinds('98765 XXXXX 1234567', ['PHONE']);
  });
  it('MK32 chained M-s -> FRAGMENT', () => {
    expectKinds('98** **10', ['FRAGMENT']);
  });
});

describe('§10.2 inserted characters, extensions, #', () => {
  it('IC1-IC7 inserted characters -> PHONE', () => {
    expectKinds('98765*43210', ['PHONE']);
    expectKinds('98765x43210', ['PHONE']);
    expectKinds('98765#43210', ['PHONE']);
    expectKinds('98x76543210', ['PHONE']);
    expectKinds('98765 x 43210', ['PHONE']);
    expectKinds('98765 4x210', ['PHONE']);
    expectKinds('5550100x204', ['PHONE']);
  });
  it('IC9 edge single x is ordinary -> PHONE', () => {
    expectKinds('x9876543210', ['PHONE']);
  });
  it('IC10 letter ends stretch -> []', () => {
    expectKinds('98765a43210', []);
  });
  it('EX1-EX3 extensions on a base -> PHONE', () => {
    expectKinds('5550100 ext 204', ['PHONE']);
    expectKinds('5550100 extension 204', ['PHONE']);
    expectKinds('5550100 x204', ['PHONE']);
  });
  it('EX4 no base, <6 digits -> FRAGMENT', () => {
    expectKinds('ext 204', ['FRAGMENT']);
    expectKinds('extension 567', ['FRAGMENT']);
  });
  it('EX5 no base, >=6 digits -> PHONE', () => {
    expectKinds('extension 5550100', ['PHONE']);
  });
  it('HS1 Order #12345678 (Class O + #) -> []', () => {
    expectKinds('Order #12345678', []);
  });
  it('HS4 generic # -> PHONE', () => {
    expectKinds('#9876543210', ['PHONE']);
  });
});

describe('§10.3 reference labels and prose', () => {
  it('RL1 reference-only labels -> []', () => {
    expectKinds('Tender No. 2026/IT/0457', []);
    expectKinds('RFP No. 2026/IT/0457', []);
    expectKinds('Ref 2026/IT/0457', []);
  });
  it('RL2 Class O + lexical designator -> []', () => {
    expectKinds('Tender ID 12345678', []);
    expectKinds('Order No. 4567890', []);
    expectKinds('Case number 12345678', []);
  });
  it('RL2b (Δ rev. 4) colon is not a designator -> PHONE', () => {
    expectKinds('Order: 12345678', ['PHONE']);
  });
  it('RL3 Class R -> []', () => {
    expectKinds('Invoice 12345678', []);
    expectKinds('PO 4500012345', []);
  });
  it('RL4 Class S shape -> []', () => {
    expectKinds('PIN 411001', []);
  });
  it('RL5 shape fails -> PHONE', () => {
    expectKinds('PIN 9876543210', ['PHONE']);
  });
  it('RL10-RL12 generic designators never exclude -> PHONE', () => {
    expectKinds('No. 9876543210', ['PHONE']);
    expectKinds('ID 9876543210', ['PHONE']);
    expectKinds('number 9876543210', ['PHONE']);
  });
  it('RL15 ordinary numbers -> []', () => {
    expectKinds('We serve 1200 students across 3 campuses', []);
    expectKinds('1200 students', []);
  });
  it('RL20 Class O + lexical designator, varied -> []', () => {
    expectKinds('Tender No. 9876543210', []);
    expectKinds('Order No: 12345678', []);
    expectKinds('Ticket #9876543210', []);
  });
  it('RL21 Class R / S with : or # connector -> []', () => {
    expectKinds('Ref: 2026/IT/0457', []);
    expectKinds('Invoice: 12345678', []);
    expectKinds('PIN: 411001', []);
  });
  it('UN2 units excluded -> []', () => {
    expectKinds('120000 sq ft', []);
    expectKinds('250000 kg', []);
    expectKinds('50k', []);
  });
  it('UN3 dates excluded -> []', () => {
    expectKinds('2026-10-02 10:30', []);
    expectKinds('2 Oct 2026', []);
    expectKinds('02/10/2026', []);
  });
  it('UN4 prices excluded -> []', () => {
    expectKinds('Rs 1250000', []);
    expectKinds('25%', []);
  });
  it('UN5 versions / IPv4 excluded -> []', () => {
    expectKinds('v2.10.3', []);
    expectKinds('version 10.2.1', []);
    expectKinds('192.168.10.1', []);
  });
});

describe('§10.4 separators', () => {
  it('SP1-SP11 all separator forms -> PHONE', () => {
    expectKinds('9876543210', ['PHONE']);
    expectKinds('98765 43210', ['PHONE']);
    expectKinds('98765.43210', ['PHONE']);
    expectKinds('98765-43210', ['PHONE']);
    expectKinds('98765–43210', ['PHONE']);
    expectKinds('98765/43210', ['PHONE']);
    expectKinds('98765,43210', ['PHONE']);
    expectKinds('(98765) 43210', ['PHONE']);
    expectKinds('98765·43210', ['PHONE']);
    expectKinds('98765_43210', ['PHONE']);
  });
  it('SP14 single 16-digit group -> []', () => {
    expectKinds('1234567890123456', []);
  });
  it('SP16 thousands/short-decimal excluded -> []', () => {
    expectKinds('9,876,543', []);
    expectKinds('12.50', []);
  });
});

describe('§10.5 email', () => {
  it('ER1/ER2 contiguous personal email -> PERSONAL_EMAIL', () => {
    expectKinds('john@gmail.com', ['PERSONAL_EMAIL']);
    expectKinds('JOHN@GMAIL.COM', ['PERSONAL_EMAIL']);
  });
  it('ER3 business email at website domain -> BUSINESS_EMAIL', () => {
    expectKinds('john@example.com', ['BUSINESS_EMAIL']);
  });
  it('ER4 subdomain -> BUSINESS_EMAIL', () => {
    expectKinds('info@mail.example.com', ['BUSINESS_EMAIL']);
  });
  it('ER5/ER6 spaced @ -> email kind', () => {
    expectKinds('john @ gmail.com', ['PERSONAL_EMAIL']);
    expectKinds('john @ example.com', ['BUSINESS_EMAIL']);
  });
  it('ER7/ER8 word at -> PERSONAL_EMAIL', () => {
    expectKinds('jane at gmail.com', ['PERSONAL_EMAIL']);
    expectKinds('jane at gmail dot com', ['PERSONAL_EMAIL']);
  });
  it('ER9-ER11 bracketed at/dot -> PERSONAL_EMAIL', () => {
    expectKinds('jane [at] gmail.com', ['PERSONAL_EMAIL']);
    expectKinds('jane [at] gmail [dot] com', ['PERSONAL_EMAIL']);
    expectKinds('jane(at)gmail(dot)com', ['PERSONAL_EMAIL']);
  });
  it('ER14 business via bracketed/word form -> BUSINESS_EMAIL', () => {
    expectKinds('info (at) example (dot) com', ['BUSINESS_EMAIL']);
    expectKinds('info at example dot com', ['BUSINESS_EMAIL']);
  });
  it('ER15-ER17 mailto: -> email kind', () => {
    expectKinds('see mailto:jane@gmail.com for details', ['PERSONAL_EMAIL']);
    expectKinds('mailto:jane@gmail.com?subject=RFP', ['PERSONAL_EMAIL']);
    expectKinds('mailto:info@example.com?subject=RFP', ['BUSINESS_EMAIL']);
  });
  it('ER18/ER19 glued punctuation -> email kind', () => {
    expectKinds('Email:jane@gmail.com', ['PERSONAL_EMAIL']);
    expectKinds('**jane@gmail.com**', ['PERSONAL_EMAIL']);
    expectKinds('Email:info@example.com', ['BUSINESS_EMAIL']);
  });
  it('ER20/ER21/ER22 uncertain -> UNCERTAIN_EMAIL', () => {
    expectKinds('jane@gmail..com', ['UNCERTAIN_EMAIL']);
    expectKinds('jane@gmail.c', ['UNCERTAIN_EMAIL']);
    expectKinds('jane@gmail', ['UNCERTAIN_EMAIL']);
    expectKinds('jane @ gmail', ['UNCERTAIN_EMAIL']);
  });
  it('ER23 fragments -> FRAGMENT', () => {
    expectKinds('jane@', ['FRAGMENT']);
    expectKinds('@gmail.com', ['FRAGMENT']);
  });
  it('ER24 ordinary word-at text -> []', () => {
    expectKinds('jane at gmail', []);
    expectKinds('meet at noon', []);
  });
  it('ER25/ER26 prose/URL guards -> []', () => {
    expectKinds('available at eprocure.gov.in', []);
    expectKinds('visit us at www.example.com', []);
  });
  it('ER27 content guards -> []', () => {
    expectKinds('rate @ 12.50', []);
    expectKinds('admin@192.168.1.1', []);
  });
  it('ER28 @acme -> []', () => {
    expectKinds('@acme', []);
    expectKinds('follow @acme', []);
  });
  it('D1 business email at parent / subdomain of W', () => {
    expectKinds('x@example.com', ['BUSINESS_EMAIL']);
    expectKinds('x@mail.example.com', ['BUSINESS_EMAIL']);
  });
  it('D2/D3 parent / sibling of a subdomain website -> PERSONAL_EMAIL', () => {
    expectKinds('x@example.com', ['PERSONAL_EMAIL'], 'shop.example.com');
    expectKinds('x@mail.example.com', ['PERSONAL_EMAIL'], 'shop.example.com');
  });
  it('D4/D5 related-looking domains -> PERSONAL_EMAIL', () => {
    expectKinds('x@example-group.com', ['PERSONAL_EMAIL']);
    expectKinds('x@example.co.in', ['PERSONAL_EMAIL']);
    expectKinds('x@notexample.com', ['PERSONAL_EMAIL']);
  });
  it('D6/D7 non-normalizable / null website -> PERSONAL_EMAIL kind', () => {
    expectKinds('info@example.com', ['PERSONAL_EMAIL'], 'not a url');
    expectKinds('info@example.com', ['PERSONAL_EMAIL'], null);
  });
  it('MI1-MI3 multiple identifiers', () => {
    expectKinds('info@example.com and jane@gmail.com', ['BUSINESS_EMAIL', 'PERSONAL_EMAIL']);
    expectKinds('info@example.com, sales@example.com', ['BUSINESS_EMAIL', 'BUSINESS_EMAIL']);
    expectKinds('info@example.com and 98765 43210', ['BUSINESS_EMAIL', 'PHONE']);
  });
});

describe('§10.5a email precedence', () => {
  it('EP1-EP3 content guards before word-at -> []', () => {
    expectKinds('Pre-bid meeting at 11.30am', []);
    expectKinds('supply at Rs.500', []);
    expectKinds('office at No.12', []);
  });
  it('EP4 genuine word-at -> PERSONAL_EMAIL', () => {
    expectKinds('jane at gmail.com', ['PERSONAL_EMAIL']);
  });
  it('EP5/EP6 spaced business/personal', () => {
    expectKinds('jane @ example.com', ['BUSINESS_EMAIL']);
    expectKinds('jane @ gmail.com', ['PERSONAL_EMAIL']);
  });
  it('EP7 valid prefix precedes guards -> PERSONAL_EMAIL', () => {
    expectKinds('jane @ 163.com', ['PERSONAL_EMAIL']);
  });
  it('EP8 business numeric-letter domain equal to W', () => {
    expectKinds('info @ 163.com', ['BUSINESS_EMAIL'], 'https://www.163.com');
  });
  it('EP10 invalid numeric domains -> []', () => {
    expectKinds('jane @ 163', []);
    expectKinds('jane@163', []);
    expectKinds('jane @ 12.50', []);
  });
  it('EP10a invalid numeric domain, 6-digit phone -> PHONE', () => {
    expectKinds('jane @ 163.456', ['PHONE']);
  });
  it('EP11/EP12 guard vs valid prefix', () => {
    expectKinds('jane@11.30am', []);
    expectKinds('jane@11.30am.com', ['PERSONAL_EMAIL']);
  });
  it('EP13 fail-closed uncertainty', () => {
    expectKinds('jane@gmail.c', ['UNCERTAIN_EMAIL']);
    expectKinds('jane @ gmail', ['UNCERTAIN_EMAIL']);
  });
});

describe('§10.6 context.* trigger helper', () => {
  it('CX6 ordinary text -> no trigger', () => {
    expect(containsAnyContactIdentifier('mid-size manufacturers', W)).toBe(false);
    expect(containsAnyContactIdentifier('Pune, India', W)).toBe(false);
  });
  it('CX7 fragments do not trigger', () => {
    expect(containsAnyContactIdentifier('jane@', W)).toBe(false);
  });
  it('CX3/CX4 obfuscated emails trigger', () => {
    expect(containsAnyContactIdentifier('contact info [at] example [dot] com', W)).toBe(true);
    expect(containsAnyContactIdentifier('jane [at] gmail [dot] com', W)).toBe(true);
  });
  it('CX5 phone triggers', () => {
    expect(containsAnyContactIdentifier('call 98765 43210', W)).toBe(true);
  });
  it('CX2 business email triggers containsAny but not containsPersonal', () => {
    expect(containsAnyContactIdentifier('info@example.com', W)).toBe(true);
    expect(containsPersonalContactIdentifier('info@example.com', W)).toBe(false);
  });
});

describe('§10.7 normalization', () => {
  it('N1 Devanagari digits -> PHONE', () => {
    expectKinds('९८७६५ ४३२१०', ['PHONE']);
  });
  it('N2 full-width digits -> PHONE', () => {
    expectKinds('９８７６５４３２１０', ['PHONE']);
  });
  it('N4 number words -> PHONE', () => {
    expectKinds('nine eight seven six five four three two one zero', ['PHONE']);
  });
  it('N5 tel: mid-text -> PHONE', () => {
    expectKinds('call tel:+15550100 now', ['PHONE']);
  });
  it('N6 tel: empty -> FRAGMENT; tel:123 -> []', () => {
    expectKinds('tel:', ['FRAGMENT']);
    expectKinds('tel:123', []);
  });
});

describe('§10.1 additional masking rows', () => {
  it('MK9 Call 98765 43210 ** -> PHONE', () => {
    expectKinds('Call 98765 43210 **', ['PHONE']);
  });
  it('MK19 Call **9876543210** 24x7 -> PHONE', () => {
    expectKinds('Call **9876543210** 24x7', ['PHONE']);
  });
  it('MK20 two matched pairs, window -> PHONE', () => {
    expectKinds('**98765 43210**, **98765 43211**', ['PHONE']);
  });
  it('MK23 cluster 6; core 10 -> U2 -> PHONE', () => {
    expectKinds('9876543210 XXX XXX', ['PHONE']);
  });
  it('MK25 digitless unit -> none; remainder 10 -> PHONE', () => {
    expectKinds('Plot XX, 9876543210', ['PHONE']);
  });
  it('MK27 two pairs -> PHONE', () => {
    expectKinds('**98765** **43210**', ['PHONE']);
  });
  it('MK31 loose gap -> FRAGMENT, PHONE', () => {
    expectKinds('98765 XXXXX, 1234567', ['FRAGMENT', 'PHONE']);
  });
  it('IC8 unmatched, fused both sides -> M-s; FRAGMENT', () => {
    expectKinds('98765**43210', ['FRAGMENT']);
  });
});

describe('§10.2 additional # / extension rows', () => {
  it('HS2 # inserted -> PHONE', () => {
    expectKinds('5550100#204', ['PHONE']);
  });
  it('HS3 Call 98765 # 43210 -> PHONE', () => {
    expectKinds('Call 98765 # 43210', ['PHONE']);
  });
  it('EX6 next 9876543210 -> PHONE', () => {
    expectKinds('next 9876543210', ['PHONE']);
  });
});

describe('§10.3 additional reference-label rows', () => {
  it('RL6 to order <phone> -> PHONE', () => {
    expectKinds('to order 98765 43210', ['PHONE']);
  });
  it('RL8 WhatsApp Business account <phone> -> PHONE', () => {
    expectKinds('WhatsApp Business account 9876543210', ['PHONE']);
  });
  it('RL9 token completeness fails -> PHONE', () => {
    expectKinds('Order No. 98765 43210', ['PHONE']);
  });
  it('RL13 contact words never exclude -> PHONE', () => {
    expectKinds('Mobile No. 9876543210', ['PHONE']);
    expectKinds('Call 9876543210', ['PHONE']);
  });
  it('RL16 §4.11(a) over-capture -> PHONE', () => {
    expectKinds('Pune 411001', ['PHONE']);
  });
  it('RL17/RL18 ordinary-word + colon -> PHONE', () => {
    expectKinds('To order: 9876543210', ['PHONE']);
    expectKinds('Business account: 9876543210', ['PHONE']);
  });
  it('RL19 generic designators with colon -> PHONE', () => {
    expectKinds('No: 9876543210', ['PHONE']);
    expectKinds('ID: 9876543210', ['PHONE']);
  });
  it('RL22 reference without designator -> PHONE', () => {
    expectKinds('For reference 9876543210', ['PHONE']);
  });
  it('RL23 comma is not GAP_L -> PHONE', () => {
    expectKinds('To order, no. 9876543210', ['PHONE']);
  });
  it('RL24 token completeness fails (two numbers) -> PHONE', () => {
    expectKinds('Order ID: 9876543210 / 9876543211', ['PHONE']);
  });
  it('RL25 complete construction; date excluded -> []', () => {
    expectKinds('Tender No.: 2026/IT/0457 dated 02/10/2026', []);
  });
  it('UN1 unit token JOIN_NEAR another group -> PHONE', () => {
    expectKinds('98765 43210 kg', ['PHONE']);
  });
});

describe('§10.4 additional separator rows', () => {
  it('SP9 parenthesised area code -> PHONE', () => {
    expectKinds('(022) 2345 6789', ['PHONE']);
  });
  it('SP12 line break -> PHONE', () => {
    expectKinds('98765\n43210', ['PHONE']);
  });
  it('SP13 window rule over multiple numbers -> PHONE', () => {
    expectKinds('9876543210 9876543211', ['PHONE']);
  });
  it('SP15 bare 6-digit run -> PHONE (K1-I4)', () => {
    expectKinds('234567', ['PHONE']);
  });
  it('SP17 uncurrencied decimal list / dimensions -> PHONE', () => {
    expectKinds('12.50, 13.75', ['PHONE']);
  });
});

describe('§10.5 additional email rows', () => {
  it('ER29 §4.11(a) word-at non-prose local -> PERSONAL_EMAIL', () => {
    expectKinds('Tenders at eprocure.gov.in', ['PERSONAL_EMAIL']);
  });
  it('ER30 full-width / zero-width obfuscation -> PERSONAL_EMAIL', () => {
    expectKinds('ｊａｎｅ＠ｇｍａｉｌ．ｃｏｍ', [
      'PERSONAL_EMAIL',
    ]);
    expectKinds('jane​@gmail.com', ['PERSONAL_EMAIL']);
  });
});

describe('§10.5a additional precedence rows', () => {
  it('EP9 representative prices -> []', () => {
    expectKinds('rate @ 12.50', []);
    expectKinds('rate @ Rs.500', []);
  });
});

describe('§10.6 context.* additional rows', () => {
  it('CX9 obfuscated phone triggers', () => {
    expect(containsAnyContactIdentifier('98765*43210', W)).toBe(true);
  });
  it('CX10 bare run triggers', () => {
    expect(containsAnyContactIdentifier('9876543210', W)).toBe(true);
  });
  it('CX11 uncertain email triggers', () => {
    expect(containsAnyContactIdentifier('jane@gmail', W)).toBe(true);
  });
  it('CX15 §4.11(a) triggers', () => {
    expect(containsAnyContactIdentifier('Mumbai 400001', W)).toBe(true);
  });
  it('CX16 time / price text does not trigger', () => {
    expect(containsAnyContactIdentifier('meetings at 11.30am', W)).toBe(false);
    expect(containsAnyContactIdentifier('supply at Rs.500', W)).toBe(false);
  });
});

describe('§4.6.10 worked determinations (normative)', () => {
  it('98765 43XXX -> FRAGMENT', () => {
    expectKinds('98765 43XXX', ['FRAGMENT']);
  });
  it('98765 43210 XXXXX -> PHONE', () => {
    expectKinds('98765 43210 XXXXX', ['PHONE']);
  });
  it('9876543210 XXX XXX -> PHONE', () => {
    expectKinds('9876543210 XXX XXX', ['PHONE']);
  });
  it('98765 43210 / 98XXX XXXXX -> PHONE, FRAGMENT', () => {
    expectKinds('98765 43210 / 98XXX XXXXX', ['PHONE', 'FRAGMENT']);
  });
  it('555-0100, 555-01XX -> PHONE, FRAGMENT', () => {
    expectKinds('555-0100, 555-01XX', ['PHONE', 'FRAGMENT']);
  });
  it('+91 98765 XXXXX -> FRAGMENT', () => {
    expectKinds('+91 98765 XXXXX', ['FRAGMENT']);
  });
  it('98765 XXXXX 1234567 -> PHONE', () => {
    expectKinds('98765 XXXXX 1234567', ['PHONE']);
  });
});
