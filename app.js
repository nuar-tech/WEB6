/* ===== 1. DATA: the party from the picture (rooms left->right, guests left->right) ===== */
const ICON = {phone:'📱', glasses:'👓', bag:'👜', cup:'☕', crumbs:'🍰'};
const G = (name, color, time, aitu, things) => ({name, color, time, aitu, things});
const PARTY = [
  {id:'balcony', name:'Balcony', floor:2, guests:[
    G('Aigerim','green','20:45',true,['cup','crumbs']),
    G('Aliya','black','21:15',false,['phone','cup']),
    G('Madina','green','22:10',false,['phone','bag','crumbs']),
    G('Ivan','black','20:10',true,['cup'])]},
  {id:'hall', name:'Hall', floor:2, guests:[
    G('Arman','yellow','20:35',false,['bag','glasses']),
    G('Sophia','purple','21:20',true,['phone']),
    G('Dias','green','19:45',true,[]),
    G('Bekzat','purple','20:55',false,['bag','cup','crumbs']),
    G('Aruzhan','black','21:50',true,['phone']),
    G('Saule','green','21:25',false,['glasses'])]},
  {id:'kitchen', name:'Kitchen', floor:1, guests:[
    G('Nurlan','red','19:40',true,['phone','cup']),
    G('Emma','black','20:15',false,['bag']),
    G('Timur','green','21:05',true,['phone','bag','crumbs']),
    G('Sergey','yellow','20:50',false,[]),
    G('Yerlan','red','21:40',true,['glasses','phone']),
    G('Kamila','black','20:05',false,['cup'])]},
  {id:'living', name:'Living room', floor:1, guests:[
    G('Daniel','blue','19:55',false,['glasses']),
    G('Zarina','green','21:10',false,['bag','phone','crumbs']),
    G('Natasha','yellow','20:30',true,[]),
    G('Askar','black','21:00',true,['phone']),
    G('Inkar','purple','20:20',false,['bag'])]}
];

/* ===== 2. BUILD THE PAGE FROM THE ARRAY ===== */
const toMin = t => { const [h, m] = t.split(':'); return h * 60 + +m; };

function card(g, idx) {
  const $c = $('<div class="guest">')
    .addClass('c-' + g.color)                               // clothing colour as class
    .toggleClass('aitu', g.aitu)                            // AITU student as class
    .attr({'data-name': g.name, 'data-time': g.time,        // data-* attributes
           'data-min': toMin(g.time), 'data-idx': idx,
           'data-things': g.things.join(' ')});
  g.things.forEach(t => $c.addClass('has-' + t));           // things as classes
  const $av = $('<div class="av">')
    .append($('<img class="ring">').attr('src', 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + g.name));
  if (g.aitu) $av.append('<span class="badge">🎓</span>');
  const icons = g.things.map(t => '<span class="thing t-' + t + '">' + ICON[t] + '</span>').join('');
  return $c.append($av, $('<div class="nm">').text(g.name),
                   $('<div class="tm">').text('⏲ ' + g.time), $('<div class="things">').html(icons));
}

function build() {
  const $h = $('#house').empty();
  [2, 1].forEach(f => {
    const $f = $('<section class="floor floor-' + f + '">').append('<div class="flabel">FLOOR ' + f + '</div>');
    PARTY.filter(r => r.floor === f).forEach(r => {
      const $r = $('<div class="room">').attr({id: r.id, 'data-title': r.name}).append($('<h3>').text(r.name));
      const $g = $('<div class="guests">').appendTo($r);
      r.guests.forEach((g, i) => $g.append(card(g, i)));
      $f.append($r);
    });
    $h.append($f);
  });
  $('#result').text('Choose a case');
  $(document).trigger('build:done');
}

/* ===== 3 + 4. THE 20 CASES: each one is ONE jQuery chain that searches the page ===== */
const CASES = [
 ['Who is in the hall?',                 () => $('#hall .guest')],
 ['Dressed in yellow or purple?',        () => $('.guest.c-yellow, .guest.c-purple')],
 ['AITU students upstairs',              () => $('.floor-2 .guest.aitu')],
 ['Glasses or a bag',                    () => $('.guest').filter('.has-glasses, .has-bag')],
 ['Came with nothing',                   () => $('.guest:not([class*=has-])')],
 ['Phone but no bag',                    () => $('.guest.has-phone:not(.has-bag)')],
 ['Arrived 20:30 - 21:00 (inclusive)',   () => $('.guest').filter(function () { const m = $(this).data('min'); return m >= 1230 && m <= 1260; })],
 ['After 21:00 and not AITU',            () => $('.guest:not(.aitu)').filter(function () { return $(this).data('min') > 1260; })],
 ['Right next to Askar',                 () => $('.guest[data-name=Askar]').prev().add('.guest[data-name=Askar] + .guest')],
 ['Last in each room',                   () => $('.guest:last-child')],
 ['Third in each room',                  () => $('.guest:nth-child(3)')],
 ['After Timur in his room',             () => $('.guest[data-name=Timur]').nextAll()],
 ['Right before someone in black',       () => $('.guest.c-black').prev()],
 ['Aruzhan\'s room',                     () => $('.guest[data-name=Aruzhan]').closest('.room')],
 ['Rooms with fewer than 6 guests',      () => $('.room').filter(function () { return $(this).find('.guest').length < 6; })],
 ['Rooms with a cup but no glasses',     () => $('.room:has(.has-cup):not(:has(.has-glasses))')],
 ['First to arrive in each room',        () => $('.guest').filter(function () {
                                              const t = $(this).data('min');
                                              return $(this).siblings('.guest').filter(function () { return $(this).data('min') < t; }).length === 0; })],
 ['Miras comes (fadeIn)',                () => card({name:'Miras', color:'blue', time:'21:20', aitu:true, things:['phone']}, 99)
                                              .hide().insertAfter('.guest[data-name=Askar]').fadeIn(800)],
 ['Natasha leaves (fadeOut + remove)',   () => $('.guest[data-name=Natasha]').fadeOut(800, function () { $(this).remove(); })],
 ['THE THIEF',                           () => $('.floor-1 .guest.has-crumbs:not(.has-cup)')
                                              .filter(function () { const m = $(this).data('min'); return m > 1260 && m < 1290; })
                                              .filter(function () { return $(this).prev().add($(this).next()).filter('.aitu').length > 0; })]
];

function show($f, n) {
  $('.found').removeClass('found');
  $f.addClass('found');
  $f.filter('.guest').find('.av').stop(true).css('top', 0)       // one jump with animate()
    .animate({top: -14}, 150).animate({top: 0}, 150);
  const names = $f.map(function () {
    return $(this).is('.guest') ? $(this).attr('data-name') : $(this).attr('data-title');
  }).get().join(', ');
  $('#result').text('Case ' + n + ': ' + CASES[n - 1][0] + ' → ' + $f.length + ' found: ' + names);
  $(document).trigger('case:done', [$f]);
}

$(function () {
  CASES.forEach((c, i) =>
    $('<button>').text(i + 1).attr('title', c[0]).appendTo('#controls')
      .on('click', function () { build(); show(c[1](), i + 1); }));   // rebuild, then solve
  build();
});
