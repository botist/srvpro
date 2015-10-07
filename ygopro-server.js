// Generated by CoffeeScript 1.9.3
(function() {
  var Graveyard, Room, _, bunyan, debug, dialogues, execFile, fs, http, http_server, log, net, os, path, request, settings, tips, tribute, url, ygopro;

  net = require('net');

  http = require('http');

  url = require('url');

  path = require('path');

  fs = require('fs');

  os = require('os');

  execFile = require('child_process').execFile;

  _ = require('underscore');

  _.str = require('underscore.string');

  _.mixin(_.str.exports());

  request = require('request');

  bunyan = require('bunyan');

  settings = require('./config.json');

  ygopro = require('./ygopro.js');

  Room = require('./room.js');

  debug = false;

  log = null;

  if (process.argv[2] === '--debug') {
    settings.port++;
    if (settings.modules.http) {
      settings.modules.http.port++;
    }
    log = bunyan.createLogger({
      name: "mycard-debug"
    });
  } else {
    log = bunyan.createLogger({
      name: "mycard"
    });
  }

  Graveyard = [];

  tribute = function(socket) {
    setTimeout((function(socket) {
      Graveyard.push(socket);
    })(socket), 3000);
  };

  setInterval(function() {
    var fuck, i, j, k, l, len, len1, ref, you;
    for (i = k = 0, len = Graveyard.length; k < len; i = ++k) {
      fuck = Graveyard[i];
      if (Graveyard[i]) {
        Graveyard[i].destroy();
      }
      ref = Graveyard[i];
      for (j = l = 0, len1 = ref.length; l < len1; j = ++l) {
        you = ref[j];
        Graveyard[i][j] = null;
      }
      Graveyard[i] = null;
    }
    Graveyard = [];
  }, 3000);

  net.createServer(function(client) {
    var ctos_buffer, ctos_message_length, ctos_proto, server, stoc_buffer, stoc_message_length, stoc_proto;
    server = new net.Socket();
    client.server = server;
    client.setTimeout(300000);
    client.on('close', function(had_error) {
      tribute(client);
      if (!client.closed) {
        client.closed = true;
        if (client.room) {
          client.room.disconnect(client);
        }
      }
      server.end();
    });
    client.on('error', function(error) {
      tribute(client);
      if (!client.closed) {
        client.closed = error;
        if (client.room) {
          client.room.disconnect(client, error);
        }
      }
      server.end();
    });
    client.on('timeout', function() {
      server.end();
    });
    server.on('close', function(had_error) {
      tribute(server);
      if (!server.closed) {
        server.closed = true;
      }
      if (!client.closed) {
        ygopro.stoc_send_chat(client, "服务器关闭了连接");
        client.end();
      }
    });
    server.on('error', function(error) {
      tribute(server);
      server.closed = error;
      if (!client.closed) {
        ygopro.stoc_send_chat(client, "服务器错误: " + error);
        client.end();
      }
    });
    ctos_buffer = new Buffer(0);
    ctos_message_length = 0;
    ctos_proto = 0;
    client.pre_establish_buffers = new Array();
    client.on('data', function(data) {
      var b, buffer, cancel, datas, k, l, len, len1, looplimit, struct;
      if (client.is_post_watcher) {
        client.room.watcher.write(data);
      } else {
        ctos_buffer = Buffer.concat([ctos_buffer, data], ctos_buffer.length + data.length);
        datas = [];
        looplimit = 0;
        while (true) {
          if (ctos_message_length === 0) {
            if (ctos_buffer.length >= 2) {
              ctos_message_length = ctos_buffer.readUInt16LE(0);
            } else {
              break;
            }
          } else if (ctos_proto === 0) {
            if (ctos_buffer.length >= 3) {
              ctos_proto = ctos_buffer.readUInt8(2);
            } else {
              break;
            }
          } else {
            if (ctos_buffer.length >= 2 + ctos_message_length) {
              cancel = false;
              if (ygopro.ctos_follows[ctos_proto]) {
                b = ctos_buffer.slice(3, ctos_message_length - 1 + 3);
                if (struct = ygopro.structs[ygopro.proto_structs.CTOS[ygopro.constants.CTOS[ctos_proto]]]) {
                  struct._setBuff(b);
                  if (ygopro.ctos_follows[ctos_proto].synchronous) {
                    cancel = ygopro.ctos_follows[ctos_proto].callback(b, _.clone(struct.fields), client, server);
                  } else {
                    ygopro.ctos_follows[ctos_proto].callback(b, _.clone(struct.fields), client, server);
                  }
                } else {
                  ygopro.ctos_follows[ctos_proto].callback(b, null, client, server);
                }
              }
              if (!cancel) {
                datas.push(ctos_buffer.slice(0, 2 + ctos_message_length));
              }
              ctos_buffer = ctos_buffer.slice(2 + ctos_message_length);
              ctos_message_length = 0;
              ctos_proto = 0;
            } else {
              break;
            }
          }
          looplimit++;
          if (looplimit > 800) {
            log.info("error ctos");
            server.end();
            break;
          }
        }
        if (client.established) {
          for (k = 0, len = datas.length; k < len; k++) {
            buffer = datas[k];
            server.write(buffer);
          }
        } else {
          for (l = 0, len1 = datas.length; l < len1; l++) {
            buffer = datas[l];
            client.pre_establish_buffers.push(buffer);
          }
        }
      }
    });
    stoc_buffer = new Buffer(0);
    stoc_message_length = 0;
    stoc_proto = 0;
    server.on('data', function(data) {
      var b, looplimit, stanzas, struct;
      stoc_buffer = Buffer.concat([stoc_buffer, data], stoc_buffer.length + data.length);
      client.write(data);
      looplimit = 0;
      while (true) {
        if (stoc_message_length === 0) {
          if (stoc_buffer.length >= 2) {
            stoc_message_length = stoc_buffer.readUInt16LE(0);
          } else {
            break;
          }
        } else if (stoc_proto === 0) {
          if (stoc_buffer.length >= 3) {
            stoc_proto = stoc_buffer.readUInt8(2);
          } else {
            break;
          }
        } else {
          if (stoc_buffer.length >= 2 + stoc_message_length) {
            stanzas = stoc_proto;
            if (ygopro.stoc_follows[stoc_proto]) {
              b = stoc_buffer.slice(3, stoc_message_length - 1 + 3);
              if (struct = ygopro.structs[ygopro.proto_structs.STOC[ygopro.constants.STOC[stoc_proto]]]) {
                struct._setBuff(b);
                ygopro.stoc_follows[stoc_proto].callback(b, _.clone(struct.fields), client, server);
              } else {
                ygopro.stoc_follows[stoc_proto].callback(b, null, client, server);
              }
            }
            stoc_buffer = stoc_buffer.slice(2 + stoc_message_length);
            stoc_message_length = 0;
            stoc_proto = 0;
          } else {
            break;
          }
        }
        looplimit++;
        if (looplimit > 800) {
          log.info("error stoc");
          server.end();
          break;
        }
      }
    });
  }).listen(settings.port, function() {
    log.info("server started", settings.ip, settings.port);
  });

  ygopro.ctos_follow('PLAYER_INFO', true, function(buffer, info, client, server) {
    var name, struct;
    name = info.name.split("$")[0];
    struct = ygopro.structs["CTOS_PlayerInfo"];
    struct._setBuff(buffer);
    struct.set("name", name);
    buffer = struct.buffer;
    client.name = name;
    return false;
  });

  ygopro.ctos_follow('JOIN_GAME', false, function(buffer, info, client, server) {
    var k, len, ref;
    if (settings.modules.stop) {
      ygopro.stoc_send_chat(client, settings.modules.stop);
      ygopro.stoc_send(client, 'ERROR_MSG', {
        msg: 1,
        code: 2
      });
      client.end();
    } else if (info.version !== settings.version) {
      ygopro.stoc_send_chat(client, "版本号不符，电脑用户请更新游戏到最新版本，手机用户可以尝试使用2333端口");
      ygopro.stoc_send(client, 'ERROR_MSG', {
        msg: 4,
        code: settings.version
      });
      client.end();
    } else if (!Room.validate(info.pass)) {
      ygopro.stoc_send_chat(client, "房间密码不正确");
      ygopro.stoc_send(client, 'ERROR_MSG', {
        msg: 1,
        code: 2
      });
      client.end();
    } else if (client.name === '[INCORRECT]') {
      ygopro.stoc_send(client, 'ERROR_MSG', {
        msg: 1,
        code: 2
      });
      client.end();
    } else {
      client.room = Room.find_or_create_by_name(info.pass, client.name);
      if (!client.room) {
        ygopro.stoc_send_chat(client, "服务器已经爆满，请稍候再试");
        ygopro.stoc_send(client, 'ERROR_MSG', {
          msg: 1,
          code: 2
        });
        client.end();
      } else if (client.room.error) {
        ygopro.stoc_send_chat(client, client.room.error);
        ygopro.stoc_send(client, 'ERROR_MSG', {
          msg: 1,
          code: 2
        });
        client.end();
      } else if (client.room.started) {
        if (settings.modules.post_start_watching) {
          client.is_post_watcher = true;
          ygopro.stoc_send_chat_to_room(client.room, client.name + " 加入了观战");
          client.room.watchers.push(client);
          ref = client.room.watcher_buffers;
          for (k = 0, len = ref.length; k < len; k++) {
            buffer = ref[k];
            client.write(buffer);
          }
          ygopro.stoc_send_chat(client, "观战中.");
        } else {
          ygopro.stoc_send_chat(client, "决斗已开始");
          ygopro.stoc_send(client, 'ERROR_MSG', {
            msg: 1,
            code: 2
          });
          client.end();
        }
      } else {
        client.room.connect(client);
      }
    }
  });

  ygopro.stoc_follow('JOIN_GAME', false, function(buffer, info, client, server) {
    var watcher;
    if (!client.room) {
      return;
    }
    if (settings.modules.welcome) {
      ygopro.stoc_send_chat(client, settings.modules.welcome);
    }
    if (client.room.welcome) {
      ygopro.stoc_send_chat(client, client.room.welcome);
    }
    if (settings.modules.post_start_watching && !client.room.watcher) {
      client.room.watcher = watcher = net.connect(client.room.port, function() {
        ygopro.ctos_send(watcher, 'PLAYER_INFO', {
          name: "the Big Brother"
        });
        ygopro.ctos_send(watcher, 'JOIN_GAME', {
          version: settings.version,
          gameid: 2577,
          some_unknown_mysterious_fucking_thing: 0,
          pass: ""
        });
        ygopro.ctos_send(watcher, 'HS_TOOBSERVER');
      });
      watcher.on('data', function(data) {
        var k, len, ref, w;
        if (!client.room) {
          return;
        }
        client.room.watcher_buffers.push(data);
        ref = client.room.watchers;
        for (k = 0, len = ref.length; k < len; k++) {
          w = ref[k];
          if (w) {
            w.write(data);
          }
        }
      });
      watcher.on('error', function(error) {});
    }
  });

  if (settings.modules.dialogues) {
    dialogues = {};
    request({
      url: settings.modules.dialogues,
      json: true
    }, function(error, response, body) {
      if (_.isString(body)) {
        log.warn("dialogues bad json", body);
      } else if (error || !body) {
        log.warn('dialogues error', error, response);
      } else {
        dialogues = body;
      }
    });
  }

  ygopro.stoc_follow('GAME_MSG', false, function(buffer, info, client, server) {
    var card, k, len, line, msg, playertype, pos, ref, ref1, ref2, val;
    msg = buffer.readInt8(0);
    if (ygopro.constants.MSG[msg] === 'START') {
      playertype = buffer.readUInt8(1);
      client.is_first = !(playertype & 0xf);
      client.lp = client.room.hostinfo.start_lp;
    }

    /*
    if ygopro.constants.MSG[msg] == 'WIN' and _.startsWith(client.room.name, 'M#') and client.is_host
      pos = buffer.readUInt8(1)
      pos = 1 - pos unless client.is_first or pos == 2
      reason = buffer.readUInt8(2)
      #log.info {winner: pos, reason: reason}
      client.room.duels.push {winner: pos, reason: reason}
     */
    if (ygopro.constants.MSG[msg] === 'DAMAGE' && client.is_host) {
      pos = buffer.readUInt8(1);
      if (!client.is_first) {
        pos = 1 - pos;
      }
      val = buffer.readInt32LE(2);
      client.room.dueling_players[pos].lp -= val;
      if ((0 < (ref = client.room.dueling_players[pos].lp) && ref <= 100)) {
        ygopro.stoc_send_chat_to_room(client.room, "你的生命已经如风中残烛了！");
      }
    }
    if (ygopro.constants.MSG[msg] === 'RECOVER' && client.is_host) {
      pos = buffer.readUInt8(1);
      if (!client.is_first) {
        pos = 1 - pos;
      }
      val = buffer.readInt32LE(2);
      client.room.dueling_players[pos].lp += val;
    }
    if (ygopro.constants.MSG[msg] === 'LPUPDATE' && client.is_host) {
      pos = buffer.readUInt8(1);
      if (!client.is_first) {
        pos = 1 - pos;
      }
      val = buffer.readInt32LE(2);
      client.room.dueling_players[pos].lp = val;
    }
    if (ygopro.constants.MSG[msg] === 'PAY_LPCOST' && client.is_host) {
      pos = buffer.readUInt8(1);
      if (!client.is_first) {
        pos = 1 - pos;
      }
      val = buffer.readInt32LE(2);
      client.room.dueling_players[pos].lp -= val;
      if ((0 < (ref1 = client.room.dueling_players[pos].lp) && ref1 <= 100)) {
        ygopro.stoc_send_chat_to_room(client.room, "背水一战！");
      }
    }
    if (settings.modules.dialogues) {
      if (ygopro.constants.MSG[msg] === 'SUMMONING' || ygopro.constants.MSG[msg] === 'SPSUMMONING') {
        card = buffer.readUInt32LE(1);
        if (dialogues[card]) {
          ref2 = _.lines(dialogues[card][Math.floor(Math.random() * dialogues[card].length)]);
          for (k = 0, len = ref2.length; k < len; k++) {
            line = ref2[k];
            ygopro.stoc_send_chat(client, line);
          }
        }
      }
    }
  });

  ygopro.stoc_follow('TYPE_CHANGE', false, function(buffer, info, client, server) {
    var is_host, selftype;
    selftype = info.type & 0xf;
    is_host = ((info.type >> 4) & 0xf) !== 0;
    client.is_host = is_host;
    client.pos = selftype;
  });

  ygopro.stoc_send_random_tip = function(client) {
    if (tips) {
      ygopro.stoc_send_chat(client, "Tip: " + tips[Math.floor(Math.random() * tips.length)]);
    }
  };

  tips = null;

  if (settings.modules.tips) {
    request({
      url: settings.modules.tips,
      json: true
    }, function(error, response, body) {
      tips = body;
    });
  }

  ygopro.stoc_follow('DUEL_START', false, function(buffer, info, client, server) {
    var k, len, player, ref;
    if (!client.room) {
      return;
    }
    if (!client.room.started) {
      client.room.started = true;
      client.room.dueling_players = [];
      ref = client.room.players;
      for (k = 0, len = ref.length; k < len; k++) {
        player = ref[k];
        if (player.pos !== 7) {
          client.room.dueling_players[player.pos] = player;
        }
      }
    }
    if (settings.modules.tips) {
      ygopro.stoc_send_random_tip(client);
    }
  });

  ygopro.ctos_follow('CHAT', true, function(buffer, info, client, server) {
    var cancel;
    cancel = _.startsWith(_.trim(info.msg), "/");
    switch (_.trim(info.msg)) {
      case '/ping':
        execFile('ss', ['-it', "dst " + client.remoteAddress + ":" + client.remotePort], function(error, stdout, stderr) {
          var line;
          if (error) {
            ygopro.stoc_send_chat_to_room(client.room, error);
          } else {
            line = _.lines(stdout)[2];
            if (line.indexOf('rtt') !== -1) {
              ygopro.stoc_send_chat_to_room(client.room, line);
            } else {
              ygopro.stoc_send_chat_to_room(client.room, stdout);
            }
          }
        });
        break;
      case '/help':
        ygopro.stoc_send_chat(client, "YGOSrv233 指令帮助");
        ygopro.stoc_send_chat(client, "/help 显示这个帮助信息");
        if (settings.modules.tips) {
          ygopro.stoc_send_chat(client, "/tip 显示一条提示");
        }
        break;
      case '/tip':
        if (settings.modules.tips) {
          ygopro.stoc_send_random_tip(client);
        }
        break;
      case '/test':
        log.info(Room.players_oppentlist);
    }
    return cancel;
  });

  ygopro.ctos_follow('UPDATE_DECK', false, function(buffer, info, client, server) {
    var i, main, side;
    main = (function() {
      var k, ref, results;
      results = [];
      for (i = k = 0, ref = info.mainc; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        results.push(info.deckbuf[i]);
      }
      return results;
    })();
    side = (function() {
      var k, ref, ref1, results;
      results = [];
      for (i = k = ref = info.mainc, ref1 = info.mainc + info.sidec; ref <= ref1 ? k < ref1 : k > ref1; i = ref <= ref1 ? ++k : --k) {
        results.push(info.deckbuf[i]);
      }
      return results;
    })();
    client.main = main;
    client.side = side;
  });

  if (settings.modules.http) {
    http_server = http.createServer(function(request, response) {
      var k, len, player, ref, room, roomsjson, u;
      u = url.parse(request.url, 1);
      if (u.pathname === '/count.json') {
        response.writeHead(200);
        response.end(Room.all.length.toString());
      } else if (u.pathname === '/rooms.js') {
        response.writeHead(200);
        roomsjson = JSON.stringify({
          rooms: (function() {
            var k, len, ref, results;
            ref = Room.all;
            results = [];
            for (k = 0, len = ref.length; k < len; k++) {
              room = ref[k];
              if (room.established) {
                results.push({
                  roomid: room.port.toString(),
                  roomname: room.name.split('$', 2)[0],
                  needpass: (room.name.indexOf('$') !== -1).toString(),
                  users: (function() {
                    var l, len1, ref1, results1;
                    ref1 = room.players;
                    results1 = [];
                    for (l = 0, len1 = ref1.length; l < len1; l++) {
                      player = ref1[l];
                      if (player.pos != null) {
                        results1.push({
                          id: (-1).toString(),
                          name: player.name,
                          pos: player.pos
                        });
                      }
                    }
                    return results1;
                  })(),
                  istart: room.started ? 'start' : 'wait'
                });
              }
            }
            return results;
          })()
        });
        response.end("loadroom( " + roomsjson + " );");
      } else if (u.query.operation === 'getroomjson') {
        response.writeHead(200);
        response.end(JSON.stringify({
          rooms: (function() {
            var k, len, ref, results;
            ref = Room.all;
            results = [];
            for (k = 0, len = ref.length; k < len; k++) {
              room = ref[k];
              if (room.established) {
                results.push({
                  roomid: room.port.toString(),
                  roomname: room.name.split('$', 2)[0],
                  needpass: (room.name.indexOf('$') !== -1).toString(),
                  users: (function() {
                    var l, len1, ref1, results1;
                    ref1 = room.players;
                    results1 = [];
                    for (l = 0, len1 = ref1.length; l < len1; l++) {
                      player = ref1[l];
                      if (player.pos != null) {
                        results1.push({
                          id: (-1).toString(),
                          name: player.name,
                          pos: player.pos
                        });
                      }
                    }
                    return results1;
                  })(),
                  istart: room.started ? "start" : "wait"
                });
              }
            }
            return results;
          })()
        }));
      } else if (u.query.pass === settings.modules.http.password && u.query.shout) {
        ref = Room.all;
        for (k = 0, len = ref.length; k < len; k++) {
          room = ref[k];
          ygopro.stoc_send_chat_to_room(room, u.query.shout);
        }
        response.writeHead(200);
        response.end("shout " + u.query.shout + " ok");
      } else if (u.query.pass === settings.modules.http.password && u.query.stop) {
        settings.modules.stop = u.query.stop;
        response.writeHead(200);
        response.end("stop " + u.query.stop + " ok");
      } else if (u.query.pass === settings.modules.http.password && u.query.welcome) {
        settings.modules.welcome = u.query.welcome;
        response.writeHead(200);
        response.end("welcome " + u.query.welcome + " ok");
      } else {
        response.writeHead(404);
        response.end();
      }
    });
    http_server.listen(settings.modules.http.port);
  }

}).call(this);
