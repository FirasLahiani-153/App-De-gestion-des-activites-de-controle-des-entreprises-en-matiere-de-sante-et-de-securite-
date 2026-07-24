<?php

/**
 * Visit location reference list — Tunisia's 24 governorates, plus any
 * sub-regions worth tracking separately (e.g. Djerba, part of Médenine
 * governorate but distinct enough to warrant its own entry).
 *
 * To add/edit a location: just edit this array. No migration needed —
 * visites.lieu is a plain string column validated against this list.
 */

return [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
    'Nabeul', 'Zaghouan', 'Bizerte',
    'Béja', 'Jendouba', 'Le Kef', 'Siliana',
    'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Tataouine',
    'Gafsa', 'Tozeur', 'Kébili',
    'Djerba',
    'Kerkennah',
    'Zarzis',
    'Menzel Bourguiba',
];