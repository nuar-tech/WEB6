/* Task 2 – effects. Uses PARTY, build(), and the events 'build:done' / 'case:done' from app.js */
let $open = null;                                   // the one open card
const T = {phone:'a phone', glasses:'glasses', bag:'a bag', cup:'a cup', crumbs:'cake crumbs'};
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const roomOf = id => PARTY.find(r => r.id === id);

/* after every build: close card, add "Sort by time" buttons */
$(document).on('build:done', function () {
  closeCard(true);
  $('.room h3').append($('<button class="sortbtn">').text('Sort by time'));
});

/* ---------- 1. SPOTLIGHT ---------- */
$(document).on('case:done', function (e, $f) {
  let $keep = $f.filter('.guest').add($f.filter('.room').find('.guest'));   // rooms -> their guests stay bright
  $('.guest').not('.ghost,.arriving').not($keep).stop(true).fadeTo(300, 0.2);
  $keep.not(':animated').stop(true).fadeTo(300, 1);                          // don't cancel fadeIn/fadeOut of cases 18/19
});
$(function () { $('#controls').append($('<button id="clear">').text('Clear')); });
$(document).on('click', '#clear', function () {
  $('.found').removeClass('found');
  $('.guest').not('.ghost,.arriving').stop(true).fadeTo(300, 1);
});

/* ---------- 2. GUEST CARD ---------- */
$(function () {
  $('#house').on('click', '.guest:not(.ghost,.arriving)', function () {
    const same = $open && $open.data('guest')[0] === this;
    closeCard();                                    // only one card at a time
    if (!same) openCard($(this));
  });
});
$(document).on('click', function (e) {              // click outside
  if ($open && !$(e.target).closest('.gcard, .guest').length) closeCard();
});
$(document).on('keydown', function (e) { if (e.key === 'Escape') closeCard(); });

function openCard($g) {
  const things = ($g.attr('data-things') || '').split(' ').filter(Boolean);
  const cur = $g.closest('.room').attr('id');
  const $c = $('<div class="gcard">').append(
    $('<img>').attr('src', $g.find('.ring').attr('src')),
    $('<h4>').text($g.attr('data-name')),
    $('<p>').text('Came at ' + $g.attr('data-time')),
    $('<p>').text($g.hasClass('aitu') ? 'AITU student' : 'Not an AITU student'),
    $('<p>').text(things.length ? 'Has ' + list(things.map(t => T[t])) : 'Came with nothing'),
    $('<p>').text('Room: ' + $g.closest('.room').attr('data-title')),
    PARTY.filter(r => r.id !== cur).map(r =>
      $('<button class="mv">').attr('data-to', r.id).text('Move to the ' + r.name.toLowerCase()))
  ).appendTo('body');
  const $r = $g.find('.ring'), o = $r.offset(), s = $r.outerWidth();
  const W = $c.outerWidth(), H = $c.outerHeight();                       // full size
  const left = Math.max(8, Math.min(o.left + s / 2 - W / 2, $(document).width() - W - 8));
  const top = Math.max(8, o.top + s / 2 - H / 2);
  $c.data({from: {left: o.left, top: o.top, size: s}, guest: $g})
    .css({left: o.left, top: o.top, width: s, height: s, opacity: 0.3})   // start on the photo
    .animate({left: left, top: top, width: W, height: H, opacity: 1}, 300);
  $open = $c;
}

function closeCard(now) {
  const $c = $open; if (!$c) return;
  $open = null;
  if (now) { $c.stop(true).remove(); return; }
  const f = $c.data('from');                                             // shrink back into the photo
  $c.stop(true).animate({left: f.left, top: f.top, width: f.size, height: f.size, opacity: 0.2}, 250,
    function () { $(this).remove(); });
}

/* ---------- 3. MOVE ---------- */
$(document).on('click', '.mv', function () {
  const $g = $open.data('guest'), to = $(this).attr('data-to');
  closeCard(true);
  moveGuest($g, to);
});

function moveGuest($g, to) {
  const name = $g.attr('data-name');
  const from = PARTY.find(r => r.guests.some(x => x.name === name));     // update the ARRAY too
  if (from) roomOf(to).guests.push(from.guests.splice(from.guests.findIndex(x => x.name === name), 1)[0]);

  const dur = 700, a = $g.offset(), op = $g.css('opacity');
  const full = $g.css(['width', 'marginLeft', 'marginRight', 'paddingLeft', 'paddingRight']);
  const $fly = $g.clone(), $new = $g.clone();
  const $box = $('#' + to + ' .guests');
  const idx = Math.max(-1, ...$box.children().map(function () { return +$(this).attr('data-idx'); }).get()) + 1;

  $new.attr('data-idx', idx).addClass('arriving').css({visibility: 'hidden', left: 0, top: 0}).appendTo($box);
  const b = $new.offset();                                               // where the card will land
  $new.css({width: 0, marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, overflow: 'hidden'});
  $fly.addClass('fly').css({left: a.left, top: a.top, width: full.width, opacity: op}).appendTo('body');
  $g.addClass('ghost');

  $fly.animate({left: b.left, top: b.top}, dur);                         // flies across the house
  $g.animate({width: 0, marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0}, dur); // old gap closes
  $new.animate(full, dur);                                               // new gap opens

  $.when($fly.promise(), $g.promise(), $new.promise()).done(function () {
    $fly.remove(); $g.remove();
    $new.removeClass('arriving').removeAttr('style').css('opacity', op);
  });
}

/* ---------- 4. SORT BY TIME ---------- */
$(document).on('click', '.sortbtn', function () {
  const $room = $(this).closest('.room');
  if ($room.find('.ghost, .arriving').length) return;                    // a move is running in this room
  const sorted = !$room.data('sorted'); $room.data('sorted', sorted);    // click again = back to the picture order
  const $box = $room.find('.guests'), $c = $box.children('.guest');
  const before = $c.map(function () { return $(this).stop('sort', true).offset(); }).get(); // where they are NOW
  const key = el => +$(el).attr(sorted ? 'data-min' : 'data-idx');
  $box.append($c.get().sort((x, y) => key(x) - key(y)));                 // reorder the DOM
  $c.css({left: 0, top: 0});
  $c.each(function (i) {                                                 // start from the old spot, slide to the new one
    const n = $(this).offset();
    $(this).css({left: before[i].left - n.left, top: before[i].top - n.top})
      .animate({left: 0, top: 0}, {duration: 600, queue: 'sort'}).dequeue('sort');
  });
});
