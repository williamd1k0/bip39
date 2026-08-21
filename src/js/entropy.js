/*
 * Detects entropy from a string.
 *
 * Formats include:
 * binary [0-1]
 * base 6 [0-5]
 * dice 6 [1-6]
 * decimal [0-9]
 * hexadecimal [0-9A-F]
 * card [A2-9TJQK][CDHS]
 *
 * Automatically uses lowest entropy to avoid issues such as interpretting 0101
 * as hexadecimal which would be 16 bits when really it's only 4 bits of binary
 * entropy.
 */

window.Entropy = new (function() {

    let eventBits = {

    "binary": {
        "0": "0",
        "1": "1",
    },

    // log2(6) = 2.58496 bits per roll, with bias
    // 4 rolls give 2 bits each
    // 2 rolls give 1 bit each
    // Average (4*2 + 2*1) / 6 = 1.66 bits per roll without bias
    "base 6": {
        "0": "00",
        "1": "01",
        "2": "10",
        "3": "11",
        "4": "0",
        "5": "1",
    },

    // log2(6) = 2.58496 bits per roll, with bias
    // 4 rolls give 2 bits each
    // 2 rolls give 1 bit each
    // Average (4*2 + 2*1) / 6 = 1.66 bits per roll without bias
    "base 6 (dice)": {
        "0": "00", // equivalent to 0 in base 6
        "1": "01",
        "2": "10",
        "3": "11",
        "4": "0",
        "5": "1",
    },

    // log2(10) = 3.321928 bits per digit, with bias
    // 8 digits give 3 bits each
    // 2 digits give 1 bit each
    // Average (8*3 + 2*1) / 10 = 2.6 bits per digit without bias
    "base 10": {
        "0": "000",
        "1": "001",
        "2": "010",
        "3": "011",
        "4": "100",
        "5": "101",
        "6": "110",
        "7": "111",
        "8": "0",
        "9": "1",
    },

    "hexadecimal": {
        "0": "0000",
        "1": "0001",
        "2": "0010",
        "3": "0011",
        "4": "0100",
        "5": "0101",
        "6": "0110",
        "7": "0111",
        "8": "1000",
        "9": "1001",
        "a": "1010",
        "b": "1011",
        "c": "1100",
        "d": "1101",
        "e": "1110",
        "f": "1111",
    },

    // log2(52) = 5.7004 bits per card, with bias
    // 32 cards give 5 bits each
    // 16 cards give 4 bits each
    // 4 cards give 2 bits each
    // Average (32*5 + 16*4 + 4*2) / 52 = 4.46 bits per card without bias
    "card": {
        "ac": "00000",
        "2c": "00001",
        "3c": "00010",
        "4c": "00011",
        "5c": "00100",
        "6c": "00101",
        "7c": "00110",
        "8c": "00111",
        "9c": "01000",
        "tc": "01001",
        "jc": "01010",
        "qc": "01011",
        "kc": "01100",
        "ad": "01101",
        "2d": "01110",
        "3d": "01111",
        "4d": "10000",
        "5d": "10001",
        "6d": "10010",
        "7d": "10011",
        "8d": "10100",
        "9d": "10101",
        "td": "10110",
        "jd": "10111",
        "qd": "11000",
        "kd": "11001",
        "ah": "11010",
        "2h": "11011",
        "3h": "11100",
        "4h": "11101",
        "5h": "11110",
        "6h": "11111",
        "7h": "0000",
        "8h": "0001",
        "9h": "0010",
        "th": "0011",
        "jh": "0100",
        "qh": "0101",
        "kh": "0110",
        "as": "0111",
        "2s": "1000",
        "3s": "1001",
        "4s": "1010",
        "5s": "1011",
        "6s": "1100",
        "7s": "1101",
        "8s": "1110",
        "9s": "1111",
        "ts": "00",
        "js": "01",
        "qs": "10",
        "ks": "11",
      },

      "tarot": {
        // log2(78 * 2) = 7.2854 bits per card, with bias
        // 128 events give 7 bits each
        // 16 cards give 4 bits each
        // 8 cards give 3 bits each
        // 4 cards give 2 bits each
        // Average (128 * 7 + 16 * 4 + 8 * 3 + 4 * 2) / (78 * 2) = 6.35 bits per event without bias
        // Major Arcana
        // 128 x 7 bits
        "00": "0000000", // The Fool
        "01": "0000001", // The Magician
        "02": "0000010", // The High Priestess
        "03": "0000011", // The Empress
        "04": "0000100", // The Emperor
        "05": "0000101", // The Hierophant
        "06": "0000110", // The Lovers
        "07": "0000111", // The Chariot
        "08": "0001000", // Strength
        "09": "0001001", // The Hermit
        "10": "0001010", // Wheel of Fortune
        "11": "0001011", // Justice
        "12": "0001100", // The Hanged Man
        "13": "0001101", // Death
        "14": "0001110", // Temperance
        "15": "0001111", // The Devil
        "16": "0010000", // The Tower
        "17": "0010001", // The Star
        "18": "0010010", // The Moon
        "19": "0010011", // The Sun
        "20": "0010100", // Judgement
        "21": "0010101", // The World
        // Minor Arcana
        "aw": "0010110", // Ace of Wands
        "2w": "0010111", // Two of Wands
        "3w": "0011000", // Three of Wands
        "4w": "0011001", // Four of Wands
        "5w": "0011010", // Five of Wands
        "6w": "0011011", // Six of Wands
        "7w": "0011100", // Seven of Wands
        "8w": "0011101", // Eight of Wands
        "9w": "0011110", // Nine of Wands
        "tw": "0011111", // Ten of Wands
        "pw": "0100000", // Page of Wands
        "nw": "0100001", // Knight of Wands
        "qw": "0100010", // Queen of Wands
        "kw": "0100011", // King of Wands
        "ac": "0100100", // Ace of Cups
        "2c": "0100101", // Two of Cups
        "3c": "0100110", // Three of Cups
        "4c": "0100111", // Four of Cups
        "5c": "0101000", // Five of Cups
        "6c": "0101001", // Six of Cups
        "7c": "0101010", // Seven of Cups
        "8c": "0101011", // Eight of Cups
        "9c": "0101100", // Nine of Cups
        "tc": "0101101", // Ten of Cups
        "pc": "0101110", // Page of Cups
        "nc": "0101111", // Knight of Cups
        "qc": "0110000", // Queen of Cups
        "kc": "0110001", // King of Cups
        "as": "0110010", // Ace of Swords
        "2s": "0110011", // Two of Swords
        "3s": "0110100", // Three of Swords
        "4s": "0110101", // Four of Swords
        "5s": "0110110", // Five of Swords
        "6s": "0110111", // Six of Swords
        "7s": "0111000", // Seven of Swords
        "8s": "0111001", // Eight of Swords
        "9s": "0111010", // Nine of Swords
        "ts": "0111011", // Ten of Swords
        "ps": "0111100", // Page of Swords
        "ns": "0111101", // Knight of Swords
        "qs": "0111110", // Queen of Swords
        "ks": "0111111", // King of Swords
        "ap": "1000000", // Ace of Pentacles
        "2p": "1000001", // Two of Pentacles
        "3p": "1000010", // Three of Pentacles
        "4p": "1000011", // Four of Pentacles
        "5p": "1000100", // Five of Pentacles
        "6p": "1000101", // Six of Pentacles
        "7p": "1000110", // Seven of Pentacles
        "8p": "1000111", // Eight of Pentacles
        "9p": "1001000", // Nine of Pentacles
        "tp": "1001001", // Ten of Pentacles
        "pp": "1001010", // Page of Pentacles
        "np": "1001011", // Knight of Pentacles
        "qp": "1001100", // Queen of Pentacles
        "kp": "1001101", // King of Pentacles
        // Major Arcana (reversed)
        "00r": "1001110", // The Fool (reversed)
        "01r": "1001111", // The Magician (reversed)
        "02r": "1010000", // The High Priestess (reversed)
        "03r": "1010001", // The Empress (reversed)
        "04r": "1010010", // The Emperor (reversed)
        "05r": "1010011", // The Hierophant (reversed)
        "06r": "1010100", // The Lovers (reversed)
        "07r": "1010101", // The Chariot (reversed)
        "08r": "1010110", // Strength (reversed)
        "09r": "1010111", // The Hermit (reversed)
        "10r": "1011000", // Wheel of Fortune (reversed)
        "11r": "1011001", // Justice (reversed)
        "12r": "1011010", // The Hanged Man (reversed)
        "13r": "1011011", // Death (reversed)
        "14r": "1011100", // Temperance (reversed)
        "15r": "1011101", // The Devil (reversed)
        "16r": "1011110", // The Tower (reversed)
        "17r": "1011111", // The Star (reversed)
        "18r": "1100000", // The Moon (reversed)
        "19r": "1100001", // The Sun (reversed)
        "20r": "1100010", // Judgement (reversed)
        "21r": "1100011", // The World (reversed)
        // Minor Arcana (reversed)
        "awr": "1100100", // Ace of Wands (reversed)
        "2wr": "1100101", // Two of Wands (reversed)
        "3wr": "1100110", // Three of Wands (reversed)
        "4wr": "1100111", // Four of Wands (reversed)
        "5wr": "1101000", // Five of Wands (reversed)
        "6wr": "1101001", // Six of Wands (reversed)
        "7wr": "1101010", // Seven of Wands (reversed)
        "8wr": "1101011", // Eight of Wands (reversed)
        "9wr": "1101100", // Nine of Wands (reversed)
        "twr": "1101101", // Ten of Wands (reversed)
        "pwr": "1101110", // Page of Wands (reversed)
        "nwr": "1101111", // Knight of Wands (reversed)
        "qwr": "1110000", // Queen of Wands (reversed)
        "kwr": "1110001", // King of Wands (reversed)
        "acr": "1110010", // Ace of Cups (reversed)
        "2cr": "1110011", // Two of Cups (reversed)
        "3cr": "1110100", // Three of Cups (reversed)
        "4cr": "1110101", // Four of Cups (reversed)
        "5cr": "1110110", // Five of Cups (reversed)
        "6cr": "1110111", // Six of Cups (reversed)
        "7cr": "1111000", // Seven of Cups (reversed)
        "8cr": "1111001", // Eight of Cups (reversed)
        "9cr": "1111010", // Nine of Cups (reversed)
        "tcr": "1111011", // Ten of Cups (reversed)
        "pcr": "1111100", // Page of Cups (reversed)
        "ncr": "1111101", // Knight of Cups (reversed)
        "qcr": "1111110", // Queen of Cups (reversed)
        "kcr": "1111111", // King of Cups (reversed)
        // 16 x 7 bits
        "asr": "0000", // Ace of Swords (reversed)
        "2sr": "0001", // Two of Swords (reversed)
        "3sr": "0010", // Three of Swords (reversed)
        "4sr": "0011", // Four of Swords (reversed)
        "5sr": "0100", // Five of Swords (reversed)
        "6sr": "0101", // Six of Swords (reversed)
        "7sr": "0110", // Seven of Swords (reversed)
        "8sr": "0111", // Eight of Swords (reversed)
        "9sr": "1000", // Nine of Swords (reversed)
        "tsr": "1001", // Ten of Swords (reversed)
        "psr": "1010", // Page of Swords (reversed)
        "nsr": "1011", // Knight of Swords (reversed)
        "qsr": "1100", // Queen of Swords (reversed)
        "ksr": "1101", // King of Swords (reversed)
        "apr": "1110", // Ace of Pentacles (reversed)
        "2pr": "1111", // Two of Pentacles (reversed)
        // 8 x 3 bits
        "3pr": "000", // Three of Pentacles (reversed)
        "4pr": "001", // Four of Pentacles (reversed)
        "5pr": "010", // Five of Pentacles (reversed)
        "6pr": "011", // Six of Pentacles (reversed)
        "7pr": "100", // Seven of Pentacles (reversed)
        "8pr": "101", // Eight of Pentacles (reversed)
        "9pr": "110", // Nine of Pentacles (reversed)
        "tpr": "111", // Ten of Pentacles (reversed)
        // 4 x 2 bits
        "ppr": "00", // Page of Pentacles (reversed)
        "npr": "01", // Knight of Pentacles (reversed)
        "qpr": "10", // Queen of Pentacles (reversed)
        "kpr": "11", // King of Pentacles (reversed)
      }
    }

    // matchers returns an array of the matched events for each type of entropy.
    // eg
    // matchers.binary("010") returns ["0", "1", "0"]
    // matchers.binary("a10") returns ["1", "0"]
    // matchers.hex("a10") returns ["a", "1", "0"]
    var matchers = {
        binary: function(str) {
            return str.match(/[0-1]/gi) || [];
        },
        base6: function(str) {
            return str.match(/[0-5]/gi) || [];
        },
        dice: function(str) {
            return str.match(/[1-6]/gi) || []; // ie dice numbers
        },
        base10: function(str) {
            return str.match(/[0-9]/gi) || [];
        },
        hex: function(str) {
            return str.match(/[0-9A-F]/gi) || [];
        },
        card: function(str) {
            // Format is NumberSuit, eg
            // AH ace of hearts
            // 8C eight of clubs
            // TD ten of diamonds
            // JS jack of spades
            // QH queen of hearts
            // KC king of clubs
            return str.match(/([A2-9TJQK][CDHS])/gi) || [];
        },
        tarot: function (str) {
            // Format is Major Arcana from 00 to 21,
            // or NumberSuit for Minor Arcana (similar to playing cards)
            // with optional R for reversed
          return str.match(/(([01][0-9]|2[01])|([atpnqk2-9][wpsc]))r?/gi) || [];
        }
    }

    this.fromString = function (rawEntropyStr, baseStr) {
        // Find type of entropy being used (binary, hex, dice etc)
        var base = getBase(rawEntropyStr, baseStr);
        // Convert dice to base6 entropy (ie 1-6 to 0-5)
        // This is done by changing all 6s to 0s
        if (base.str == "dice") {
            var newEvents = [];
            for (var i=0; i<base.events.length; i++) {
                var c = base.events[i];
                if ("12345".indexOf(c) > -1) {
                    newEvents[i] = base.events[i];
                }
                else {
                    newEvents[i] = "0";
                }
            }
            base.str = "base 6 (dice)";
            base.events = newEvents;
            base.matcher = matchers.base6;
        }
        // Detect empty entropy
        if (base.events.length == 0) {
            return {
                binaryStr: "",
                cleanStr: "",
                cleanHtml: "",
                base: base,
            };
        }
        // Convert entropy events to binary
        var entropyBin = base.events.map(function (e) {
          return eventBits[base.str][e.toLowerCase()];
        }).join("");
        // Get average bits per event
        // which may be adjusted for bias if log2(base) is fractional
        var bitsPerEvent = base.bitsPerEvent;
        // Supply a 'filtered' entropy string for display purposes
        var entropyClean = base.events.join("");
        var entropyHtml = base.events.join("");
        if (base.asInt == 52) {
            entropyClean = base.events.join(" ").toUpperCase();
            entropyClean = entropyClean.replace(/C/g, "\u2663");
            entropyClean = entropyClean.replace(/D/g, "\u2666");
            entropyClean = entropyClean.replace(/H/g, "\u2665");
            entropyClean = entropyClean.replace(/S/g, "\u2660");
            entropyHtml = base.events.join(" ").toUpperCase();
            entropyHtml = entropyHtml.replace(/C/g, "<span class='card-suit club'>\u2663</span>");
            entropyHtml = entropyHtml.replace(/D/g, "<span class='card-suit diamond'>\u2666</span>");
            entropyHtml = entropyHtml.replace(/H/g, "<span class='card-suit heart'>\u2665</span>");
            entropyHtml = entropyHtml.replace(/S/g, "<span class='card-suit spade'>\u2660</span>");
        } else if (base.asInt == 78 * 2) {
          let entropyLower = entropyClean.toLowerCase();
          entropyClean = "";
          entropyHtml = "";
          let charIndex = 0;
          while (charIndex < entropyLower.length) {
            let customStyle = '';
            let cleanEvent = '';
            let emoji = '';
            let pair = entropyLower.substring(charIndex, charIndex + 2);
            let reversed = entropyLower.substring(charIndex + 2, charIndex + 3) === "r";
            if (pair.match(/[01][0-9]|2[01]/)) {
              // Major Arcana
              const emojis = {
                '00': '🤡', // The Fool
                '01': '🧙', // The Magician
                '02': '👨🏻‍🏫', // The High Priestess
                '03': '👸', // The Empress
                '04': '🤴', // The Emperor
                '05': '🪬', // The Hierophant
                '06': '👩‍❤️‍👨', // The Lovers
                '07': '🛻', // The Chariot
                '08': '🏋️', // Strength
                '09': '👳', // The Hermit
                '10': '💰', // Wheel of Fortune
                '11': '⚖️', // Justice
                '12': '🪾', // The Hanged Man
                '13': '💀', // Death
                '14': '🧘', // Temperance
                '15': '👹', // The Devil
                '16': '🏰', // The Tower
                '17': '⭐', // The Star
                '18': '🌙', // The Moon
                '19': '🌞', // The Sun
                '20': '🧑‍⚖️', // Judgement
                '21': '🌍', // The World
              };
              emoji = emojis[pair];
              cleanEvent += pair;
            } else if (pair.match(/[a2-9tpnqk][wpsc]/)) {
              // Minor Arcana
              const rank = pair[0];
              const suit = pair[1];
              const emojis = {
                "w": {
                  "a": "🃑", // Ace of Wands
                  "2": "🃒", // Two of Wands
                  "3": "🃓", // Three of Wands
                  "4": "🃔", // Four of Wands
                  "5": "🃕", // Five of Wands
                  "6": "🃖", // Six of Wands
                  "7": "🃗", // Seven of Wands
                  "8": "🃘", // Eight of Wands
                  "9": "🃙", // Nine of Wands
                  "t": "🃚", // Ten of Wands
                  "p": "🃛", // Page of Wands
                  "n": "🃜", // Knight of Wands
                  "q": "🃝", // Queen of Wands
                  "k": "🃞", // King of Wands
                },
                "p": {
                  "a": "🃁", // Ace of Pentacles
                  "2": "🃂", // Two of Pentacles
                  "3": "🃃", // Three of Pentacles
                  "4": "🃄", // Four of Pentacles
                  "5": "🃅", // Five of Pentacles
                  "6": "🃆", // Six of Pentacles
                  "7": "🃇", // Seven of Pentacles
                  "8": "🃈", // Eight of Pentacles
                  "9": "🃉", // Nine of Pentacles
                  "t": "🃊", // Ten of Pentacles
                  "p": "🃋", // Page of Pentacles
                  "n": "🃌", // Knight of Pentacles
                  "q": "🃍", // Queen of Pentacles
                  "k": "🃎", // King of Pentacles
                },
                "s": {
                  "a": "🂡", // Ace of Swords
                  "2": "🂢", // Two of Swords
                  "3": "🂣", // Three of Swords
                  "4": "🂤", // Four of Swords
                  "5": "🂥", // Five of Swords
                  "6": "🂦", // Six of Swords
                  "7": "🂧", // Seven of Swords
                  "8": "🂨", // Eight of Swords
                  "9": "🂩", // Nine of Swords
                  "t": "🂪", // Ten of Swords
                  "p": "🂫", // Page of Swords
                  "n": "🂬", // Knight of Swords
                  "q": "🂭", // Queen of Swords
                  "k": "🂮", // King of Swords
                },
                "c": {
                  "a": "🂱", // Ace of Cups
                  "2": "🂲", // Two of Cups
                  "3": "🂳", // Three of Cups
                  "4": "🂴", // Four of Cups
                  "5": "🂵", // Five of Cups
                  "6": "🂶", // Six of Cups
                  "7": "🂷", // Seven of Cups
                  "8": "🂸", // Eight of Cups
                  "9": "🂹", // Nine of Cups
                  "t": "🂺", // Ten of Cups
                  "p": "🂻", // Page of Cups
                  "n": "🂼", // Knight of Cups
                  "q": "🂽", // Queen of Cups
                  "k": "🂾", // King of Cups
                },
              };
              const colors = {
                w: "green",
                p: "orange",
                s: "blue",
                c: "red",
              };
              cleanEvent += pair;
              emoji = emojis[suit][rank];
              customStyle += "color: " + colors[suit] + ";";
            } else {
              // Invalid char, skip
              charIndex++;
            }
            if (cleanEvent.length > 0) {
              charIndex += 2;
              if (reversed) {
                charIndex++;
                cleanEvent += "r";
                customStyle += `transform: scaleY(-1);
                  display: inline-block;`;
              }
              entropyHtml += "<span style='" + customStyle + "'>" + emoji + "</span>";
              entropyClean += cleanEvent;
            }
          }
        }
        // Return the result
        var e = {
            binaryStr: entropyBin,
            cleanStr: entropyClean,
            cleanHtml: entropyHtml,
            bitsPerEvent: bitsPerEvent,
            base: base,
        }
        return e;
    }

    function getBase(str, baseStr) {
        // Need to get the lowest base for the supplied entropy.
        // This prevents interpreting, say, dice rolls as hexadecimal.
        var binaryMatches = matchers.binary(str);
        var hexMatches = matchers.hex(str);
        var autodetect = baseStr === undefined;
        // Find the lowest base that can be used, whilst ignoring any irrelevant chars
        if ((binaryMatches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "binary") {
            var ints = binaryMatches.map(function(i) { return parseInt(i, 2) });
            return {
                ints: ints,
                events: binaryMatches,
                matcher: matchers.binary,
                asInt: 2,
                bitsPerEvent: 1,
                str: "binary",
            }
        }
        var cardMatches = matchers.card(str);
        if ((cardMatches.length >= hexMatches.length / 2 && autodetect) || baseStr === "card") {
            return {
                ints: [],
                events: cardMatches,
                matcher: matchers.card,
                asInt: 52,
                bitsPerEvent: (32*5 + 16*4 + 4*2) / 52, // see cardBits
                str: "card",
            }
        }
        var tarotMatches = matchers.tarot(str);
        if (baseStr === "tarot") {
            return {
                ints: [],
                events: tarotMatches,
                matcher: matchers.tarot,
                asInt: 78 * 2,
                bitsPerEvent: (128 * 7 + 16 * 4 + 8 * 3 + 4 * 2) / (78 * 2), // see tarotBits
                str: "tarot",
            }
        }

        var diceMatches = matchers.dice(str);
        if ((diceMatches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "dice") {
            var ints = diceMatches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: diceMatches,
                matcher: matchers.dice,
                asInt: 6,
                bitsPerEvent: (4*2 + 2*1) / 6, // see diceBits
                str: "dice",
            }
        }
        var base6Matches = matchers.base6(str);
        if ((base6Matches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "base 6") {
            var ints = base6Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base6Matches,
                matcher: matchers.base6,
                asInt: 6,
                bitsPerEvent: (4*2 + 2*1) / 6, // see diceBits
                str: "base 6",
            }
        }
        var base10Matches = matchers.base10(str);
        if ((base10Matches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "base 10") {
            var ints = base10Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base10Matches,
                matcher: matchers.base10,
                asInt: 10,
                bitsPerEvent: (8*3 + 2*1) / 10, // see b10Bits
                str: "base 10",
            }
        }
        var ints = hexMatches.map(function(i) { return parseInt(i, 16) });
        return {
            ints: ints,
            events: hexMatches,
            matcher: matchers.hex,
            asInt: 16,
            bitsPerEvent: 4,
            str: "hexadecimal",
        }
    }

})();
