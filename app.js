function refreshTable() {
  var hash = document.getElementById("gameHash").value;
  var lastHash = "";
  var amount = parseFloat(document.getElementById("gameAmount").value);
  var baseBet = parseFloat(document.getElementById("baseBet").value);
  var betAmount = parseInt(baseBet);
  var cashout = parseFloat(document.getElementById("cashout").value);
  var betIncrease = parseFloat(document.getElementById("betIncrease").value);
  var coins = parseFloat(document.getElementById("coins").value);

  var tableBody = document.getElementById("tbody");
  tableBody.innerHTML = "";
  for (var i = 0; i < amount; i++) {
    var gameHash = lastHash != "" ? genGameHash(lastHash) : hash;
    var gameCrash = crashPointFromHash(
      lastHash != "" ? genGameHash(lastHash) : hash
    );
    var clr =
      gameCrash > cashout ? "green" : gameCrash < cashout ? "red" : "blue";

    if (gameCrash >= cashout) {
      coins += betAmount * cashout - betAmount;
    } else {
      coins -= betAmount;
    }

    var clr2 = coins > betAmount ? "green" : coins < betAmount ? "red" : "blue";

    tableBody.innerHTML +=
      "<tr><td>" +
      gameHash +
      "</td><td style='background:" +
      clr +
      "'>" +
      gameCrash +
      "</td><td>" +
      betAmount +
      "</td><td style='background:" +
      clr2 +
      "'>" +
      coins +
      "</td><td>";

    lastHash = gameHash;

    if (gameCrash < cashout) {
      betAmount *= betIncrease;
    } else {
      betAmount = baseBet;
    }
  }
}

function divisible(hash, mod) {
  // So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
  var val = 0;

  var o = hash.length % 4;
  for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
    val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
  }

  //if it fails, baseBet increases on the next loop, if it works, bet stays the same.
  return val === 0;
}

function genGameHash(serverSeed) {
  return CryptoJS.SHA256(serverSeed).toString();
}

function hmac(key, v) {
  var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
  return hmacHasher.finalize(v).toString();
}

function crashPointFromHash(serverSeed) {
  // The client seed is a sha256 hash of "CSGOCrash"
  var hash = hmac(
    serverSeed,
    "000000000000000007a9a31ff7f07463d91af6b5454241d5faf282e5e0fe1b3a"
  );

  // In 1 of 51 games the game crashes instantly.
  if (divisible(hash, 51)) return 0;

  // Use the most significant 52-bit from the hash to calculate the crash point
  var h = parseInt(hash.slice(0, 52 / 4), 16);
  var e = Math.pow(2, 52);

  return (Math.floor((100 * e - h) / (e - h)) / 100).toFixed(2);
}
