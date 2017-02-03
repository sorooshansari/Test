angular.module('app.services', [])
.factory('appPrimaryData', function ($rootScope, FileServices) {
    var _Cities = [];
    var _Places = [];
    var _bookMarkedPlaces = [];
    var _AutorizedCities = [];
    var getUiSref = function (isAutorized, placeId, cityId) {
        if (isAutorized)
            return "tabsController.placeSearched({id: '" + placeId + "'})";
        return "tabsController.packages({id: '" + cityId + "'})";
    }
    var isAutorized = function (isPrimary, cityId) {
        if (isPrimary)
            return true;
        for (var i = 0; i < _AutorizedCities.length; i++) {
            if (_AutorizedCities[i].Id == cityId)
                return true;
        }
        return false;
    }
    var loadCities = function () {
        var tempCitites = [];
        var query = "\
                SELECT\
                    Cit_Id,\
                    Cit_Name,\
                    Cit_Desc,\
                    Cit_Dirty,\
                    Cit_ImageUrl\
                FROM Cities";
        db.executeSql(query, [],
        function (res) {
            var rows = res.rows;
            for (var i = 0; i < rows.length; i++) {
                tempCitites.push({
                    Id: rows.item(i).Cit_Id,
                    Name: rows.item(i).Cit_Name,
                    Desc: rows.item(i).Cit_Desc,
                    ImageUrl: cordova.file.dataDirectory + "/Cities_dir/" + rows.item(i).Cit_ImageUrl
                });
            }
            _Cities = tempCitites;
            $rootScope.WaitingPrimaryData--;
            var inAppRefresh = $rootScope.inAppRefresh || "false";
            if (inAppRefresh == "true") {
                $rootScope.$broadcast('primaryDataLoaded_inApp', {});
            }
            else {
                $rootScope.$broadcast('primaryDataLoaded', {});
            }
        },
        function (error) {
            console.log('error: ' + error.message);
            $rootScope.$broadcast('primaryDataFailed', {});
        });
    };
    var loadPlaces = function () {
        var query1 = "\
                SELECT\
                    AuC_Id\
                FROM AutorizedCities";
        var query2 = "\
                SELECT\
                    Pla_Id,\
                    Pla_Name,\
                    Pla_TNImgUrl,\
                    Pla_imgUrl,\
                    Pla_address,\
                    Pla_bookmarked,\
                    Cit_Name,\
                    Pla_CityId,\
                    Pla_isPrimary\
                FROM Places JOIN Cities\
                ON Places.Pla_CityId = Cities.Cit_Id\
                ORDER BY Pla_isPrimary DESC";
        db.executeSql(query1, [],
            function (res) {
                var tempAutorizedCities = [];
                var rows = res.rows;
                for (var i = 0; i < rows.length; i++) {
                    tempAutorizedCities.push({
                        Id: rows.item(i).AuC_Id
                    });
                }
                _AutorizedCities = tempAutorizedCities;
                db.executeSql(query2, [],
                    function (res) {
                        var tempPlaces = [];
                        var rows = res.rows;
                        for (var i = 0; i < rows.length; i++) {
                            var place = {
                                Id: rows.item(i).Pla_Id,
                                name: rows.item(i).Pla_Name,
                                logo: cordova.file.dataDirectory + "/TumbNameil_dir/" + rows.item(i).Pla_TNImgUrl,
                                address: rows.item(i).Pla_address,
                                city: rows.item(i).Cit_Name,
                                CityId: rows.item(i).Pla_CityId,
                                bookmarked: rows.item(i).Pla_bookmarked
                            };
                            place.isAutorized = isAutorized(rows.item(i).Pla_isPrimary, rows.item(i).Pla_CityId);
                            place.uiSref = getUiSref(place.isAutorized, rows.item(i).Pla_Id, rows.item(i).Pla_CityId);
                            tempPlaces.push(place);
                        }
                        _Places = tempPlaces;
                        $rootScope.WaitingPrimaryData--;
                        var inAppRefresh = $rootScope.inAppRefresh || "false";
                        if (inAppRefresh == "true") {
                            $rootScope.$broadcast('primaryDataLoaded_inApp', {});
                        }
                        else {
                            $rootScope.$broadcast('primaryDataLoaded', {});
                        }
                    },
                    function (error) {
                        console.log('error: ' + error.message);
                        $rootScope.$broadcast('primaryDataFailed', {});
                    });
            },
            function (error) {
                console.log('error: ' + error.message);
                $rootScope.$broadcast('primaryDataFailed', {});
            });
    };
    return {
        init: function () {
            $rootScope.WaitingPrimaryData = 2;
            loadCities();
            loadPlaces();
        },
        getCities: function () {
            return _Cities;
        },
        getPlaces: function () {
            return _Places;
        }
    };
})
.factory('player', function ($rootScope, $interval, dbServices) {
    var _player = {
        Media: null,
        hasMedia: false,
        trackInfo: null,
        isAudio: null,
        idx: null,
        PlaceId: null,
        playing: false,
        position: 0,
        duration: 0
    }
    var _free = function () {
        var lastTrackInfo = {
            name: _player.trackInfo.Name,
            isAudio: (_player.isAudio) ? 1 : 0,
            trackId: _player.trackInfo.Id,
            placeId: _player.PlaceId,
            url: _player.trackInfo.url
        };
        dbServices.AddToPlayerHistory(lastTrackInfo);
        _player.Media.stop();
        _player.Media.release();
        _player.Media = null;
        _player.hasMedia = false;
        _player.trackInfo = null;
        _player.isAudio = null;
        _player.idx = null;
        _player.PlaceId = null;
        _player.playing = false;
    };
    var _new = function (track, isAudio, idx, placeId) {
        if (_player.hasMedia) _free();
        var mediaDir = (isAudio) ? "/PlaceAudio_dir/" : "/PlaceStory_dir/";
        var Path = cordova.file.dataDirectory + mediaDir + track.url;
        _player.Media = new Media(Path, mediaSuccess, mediaError, mediaStatus);
        _player.hasMedia = true;
        _player.trackInfo = track;
        _player.isAudio = isAudio;
        _player.idx = idx;
        _player.PlaceId = placeId;
        _player.duration = _player.Media.getDuration();
        var counter = 0;
        var timerDur = setInterval(function () {
            counter = counter + 100;
            if (counter > 2000) {
                clearInterval(timerDur);
            }
            var dur = _player.Media.getDuration();
            if (dur > 0) {
                clearInterval(timerDur);
                _player.duration = parseInt(dur);
            }
        }, 100);
        $rootScope.$broadcast('playerUpdated', {});
    };
    var mediaTimer;
    var _pause = function () {
        _player.Media.pause();
        _player.playing = false;
        $interval.cancel(mediaTimer);
        $rootScope.$broadcast('playerUpdated', {});
    };
    var _play = function () {
        _player.Media.play();
        _player.playing = true;

        mediaTimer = $interval(function () {
            // get media position
            _player.Media.getCurrentPosition(
                // success callback
                function (position) {
                    if (position > -1) {
                        _player.position = parseInt(position);
                    }
                    $rootScope.$broadcast('positionUpdated', { position: parseInt(position) });
                },
                // error callback
                function (e) {
                    console.log("Error getting pos=" + e);
                }
            );
        }, 1000);

        $rootScope.$broadcast('playerUpdated', {});
    };
    var _seekTo = function (t) {
        _player.Media.seekTo(t);
        _player.Media.getCurrentPosition(
                // success callback
                function (position) {
                    if (position > -1) {
                        _player.position = parseInt(position);
                    }
                    $rootScope.$broadcast('positionUpdated', { position: parseInt(position) });
                },
                // error callback
                function (e) {
                    console.log("Error getting pos=" + e);
                }
            );
    }
    //var mediaStatusCallback = function (status) {
    //    if (status == 1) {
    //        $ionicLoading.show({ template: 'Loading...' });
    //    } else {
    //        $ionicLoading.hide();
    //    }
    //};
    var mediaSuccess = function (res) {
        console.log("media success: ", res);
    };
    var mediaError = function (err) {
        console.log("media error: ", err);
    };
    var mediaStatus = function (status) {
        console.log("media status: ", status);
    };

    return {
        info: function () {
            return _player;
        },
        play: function () {
            _play();
        },
        pause: function () {
            _pause();
        },
        New: function (track, isAudio, idx, placeId) {
            _new(track, isAudio, idx, placeId);
        },
        free: function () {
            var oldPlayer = _player;
            _free();
            return oldPlayer;
        },
        getPos: function () {
            return _player.position;
        },
        seekTo: function (t) {
            _seekTo(t);
        }
    };
})
.service('AuthServices', ['$http', '$rootScope', '$cordovaOauth', 'FileServices', '$ionicLoading',
    function ($http, $rootScope, $cordovaOauth, FileServices, $ionicLoading) {
        var UserStatus =
        {
            confirmed: 1,
            notUser: 2,
            uuidMissMatch: 3,
            notConfirmed: 4,
            unknownError: 5
        }
        var GetAutorizedCities = function (username) {
            var uuid = device.uuid;
            method = 'post';
            url = 'http://iranaudioguide.com/api/AppManager/GetAutorizedCities?username=' + username + '&uuid=' + uuid;
            $http({ method: method, url: url }).
              then(function (response) {
                  switch (response.data.status) {
                      case UserStatus.confirmed:
                          if (response.data.cities.length > 0)
                              $rootScope.$broadcast('PopulateAutorizedCities', { cities: response.data.cities });
                          else
                              $rootScope.$broadcast('loadAutorizedCities', {});
                          break;
                      case UserStatus.notUser:
                          console.error("notUser");
                          $rootScope.$broadcast('loadAutorizedCities', {});
                          break;
                      case UserStatus.uuidMissMatch:
                          console.error("uuidMissMatch");
                          $rootScope.$broadcast('loadAutorizedCities', {});
                          break;
                      case UserStatus.notConfirmed:
                          console.error("notConfirmed");
                          $rootScope.$broadcast('loadAutorizedCities', {});
                          break;
                      case UserStatus.unknownError:
                          console.error("unknownError", response.data.errorMessage);
                          $rootScope.$broadcast('loadAutorizedCities', {});
                          break;
                      default:

                  }
              }, function (response) {
                  console.error("Geting Autorized Cities Failled", response);
              });
        };
        var AutenticateUser = function (user, profilePath) {
            $http({
                url: 'http://iranaudioguide.com/api/AppManager/AutenticateGoogleUser',
                method: 'POST',
                data: user
            }).then(function (data) {
                console.log(data);
                switch (data.data) {
                    case 0: {//     Creating user was successful
                        window.localStorage.setItem("User_Name", user.name);
                        window.localStorage.setItem("User_Email", user.email);
                        window.localStorage.setItem("User_GoogleId", user.google_id);

                        if (profilePath != "") {
                            FileServices.DownloadProfilePic(user.picture, profilePath);
                        }
                        else {
                            $rootScope.$broadcast('loadProfilePicFailed', {});
                        }
                        break;
                    }
                    case 1: {//     This user was existed
                        $ionicLoading.hide();
                        alert("Authenticating user failed");
                        break;
                    }
                    case 2: {//     Creating user failed
                        $ionicLoading.hide();
                        alert("Authenticating user failed");
                        break;
                    }
                    case 3: {//     Creating user with different uuid
                        $ionicLoading.hide();
                        alert("You have already signed in with a different device.");
                        break;
                    }
                    default:
                        $ionicLoading.hide();
                        alert("Connecting to server failed.");
                        break;
                }
            });
        };
        return {
            Register: function (fullName, email, password, uuid) {
                var AppUser = { fullName: fullName, email: email, password: password, uuid: uuid };
                console.log(AppUser);
                return $http({
                    url: 'http://iranaudioguide.com/api/AppManager/ResgisterAppUser',
                    method: 'POST',
                    data: AppUser
                });
            },
            logIn: function (email, password, uuid) {
                var AppUser = { email: email, password: password, uuid: uuid };
                $http({
                    url: 'http://iranaudioguide.com/api/AppManager/AuthorizeAppUser',
                    method: 'POST',
                    data: AppUser
                }).then(function (data) {
                    $ionicLoading.hide();
                    switch (data.data.Result) {
                        case 0: {
                            var user = data.data;
                            if (user.GoogleId !== null) {
                                window.localStorage.setItem("User_Name", user.FullName);
                                window.localStorage.setItem("User_Email", user.Email);
                                window.localStorage.setItem("User_GoogleId", user.GoogleId);
                                FileServices.DownloadProfilePic(user.Picture, user.GoogleId);
                            }
                            else {
                                window.localStorage.setItem("User_Email", email);
                                $rootScope.$broadcast('LoadDefaultUser', {});
                            }
                            //GetAutorizedCities(user.Email);
                            break;
                        }
                        case 1: {
                            alert("Due to several login failures, your account has been locked out for five minutes.");
                            break;
                        }
                        case 2: {
                            alert("please confirm your email address");
                            break;
                        }
                        case 3: {
                            alert("Wrong username or password.");
                            break;
                        }
                        case 4: {
                            alert("You have already signed in with a different device.");
                            break;
                        }
                        default:
                    }
                },
                function (err) {
                    console.log(err);
                    alert("error");
                });
            },
            //Google: function (uuid) {
            //    $cordovaOauth.google("751762984773-tpuqc0d67liqab0809ssvjmgl311r1is.apps.googleusercontent.com",
            //        ["https://www.googleapis.com/auth/urlshortener",
            //        "https://www.googleapis.com/auth/userinfo.email",
            //        "https://www.googleapis.com/auth/userinfo.profile"])
            //        .then(function (result) {
            //            $ionicLoading.show({
            //                template: 'Loading...'
            //            });
            //            console.log("Google access_token", result.access_token);
            //            $http({
            //                url: 'https://www.googleapis.com/oauth2/v3/userinfo',
            //                method: 'GET',
            //                params: {
            //                    access_token: result.access_token,
            //                    format: 'json'
            //                }
            //            }).then(function (user_data) {
            //                console.log(user_data);
            //                var profilePath = user_data.data.sub + '.jpg';
            //                var user = {
            //                    name: user_data.data.name,
            //                    gender: user_data.data.gender,
            //                    email: user_data.data.email,
            //                    google_id: user_data.data.sub,
            //                    picture: user_data.data.picture,
            //                    profile: user_data.data.profile,
            //                    uuid: uuid
            //                };
            //                console.log(user);
            //                AutenticateUser(user, profilePath);
            //            }, function (err) {
            //                alert("There was a problem getting your profile.");
            //                console.log(err);
            //            });
            //        });
            //},
            SignInWithGoogle: function () {
                var uuid = device.uuid;
                window.plugins.googleplus.login(
                    {
                        'iOSApiKey': '27601873693-53lc293tvdr5gdqpivilmioedd22mcmu.apps.googleusercontent.com'
                    },
                    function (obj) {
                        console.log("google info recived");
                        var profilePath = "";
                        var user = {
                            name: obj.displayName,
                            email: obj.email,
                            google_id: obj.userId,
                            picture: "",
                            uuid: uuid
                        };
                        if (typeof obj.imageUrl !== "undefined" && obj.imageUrl != "") {
                            user.picture = obj.imageUrl;
                            profilePath = obj.userId + '.' + obj.imageUrl.split('.').pop();
                        }
                        AutenticateUser(user, profilePath);
                    },
                    function (msg) {
                        $ionicLoading.hide();
                        console.error("google info reciving failed");
                        window.plugins.googleplus.disconnect(
                            function (msg) {
                                console.error("disconnecting failed:", msg);
                            }
                        );
                        console.error("SignInWithGoogle failed:", msg);
                    }
                );
            },
            GetAutorizedCities: function (username) {
                GetAutorizedCities(username);
            },
            logOut: function () {
                window.plugins.googleplus.disconnect(
                    function (msg) {
                        console.error("logging out failed:", msg);
                    }
                );
                var queryRemove = "\
                DELETE FROM AutorizedCities";
                db.executeSql(queryRemove, [],
                    function (res) {
                        console.log("autories cities removed:", res.rowsAffected);
                        $rootScope.$broadcast('CleareUserInfo', {});
                    },
                    function (error) {
                        alert("Clear user infoes failed: " + error);
                    });
                clearUserInfoes();
            },
            recoverPass: function (email) {
                var uuid = device.uuid;
                var ForgotPassUser = { email: email, uuid: uuid };
                $http({
                    url: 'http://iranaudioguide.com/api/AppManager/ForgotPassword',
                    method: 'POST',
                    data: ForgotPassUser
                }).then(function (data) {
                    $ionicLoading.hide();
                    switch (data.data) {
                        case 0: {
                            alert("recover password link has been sent to your email");
                            break;
                        }
                        case 1: {
                            alert("not an app user");
                            break;
                        }
                        case 2: {
                            alert("please confirm your account.");
                            break;
                        }
                        case 3: {
                            alert("Wrong username or password.");
                            break;
                        }
                        case 4: {
                            alert("You have already signed in with another device.");
                            break;
                        }
                        default:
                    }
                },
                function (err) {
                    console.log(err);
                    alert("error");
                });
            }
        }
    }])
.service('ApiServices', ['$http', '$rootScope', function ($http, $rootScope) {
    return {
        GetAll: function (LUN) {
            var uuid = device.uuid;
            if (LUN == 0) {
                method = 'post';
                url = 'http://iranaudioguide.com/api/AppManager/GetAll?uuid=' + uuid;
                $http({ method: method, url: url }).
                  then(function (response) {
                      if (response.data.ErrorMessage != null && response.data.ErrorMessage.length > 0) {
                          console.error("GetAll 0-->", response.data.ErrorMessage);
                          alert("We cant connect to server. Please try again later.");
                      }
                      else {
                          $rootScope.$broadcast('PopulateTables', { Data: response.data });
                      }
                  }, function (response) {
                      $rootScope.$broadcast('ServerConnFailed', { error: response.data });
                  });
            }
            else {
                method = 'post';
                data = { LastUpdateNumber: LUN };
                url = 'http://iranaudioguide.com/api/AppManager/GetUpdates?LastUpdateNumber=' + LUN + '&uuid=' + uuid;
                $http({ method: method, url: url, data: data }).
                  then(function (response) {
                      if (response.data.ErrorMessage.length > 0) {
                          console.error("GetAll " + LUN + "-->", response.data.ErrorMessage);
                      }
                      else {
                          $rootScope.$broadcast('UpdateTables', { Data: response.data });
                      }
                  }, function (response) {
                      $rootScope.$broadcast('ServerConnFailed', { error: response.data });
                  });
            }
        },
        GetPackages: function (cityId) {
            method = 'post';
            url = 'http://iranaudioguide.com/api/AppManager/GetPackages?cityId=' + cityId;
            return $http({ method: method, url: url });
        }
    }
}])
.service('dbServices', ['$rootScope', '$cordovaSQLite', 'FileServices', function ($rootScope, $cordovaSQLite, FileServices) {
    //var db = null;

    return {
        openDB: function () {
            var isIOS = ionic.Platform.isIOS();
            var isAndroid = ionic.Platform.isAndroid();
            if (isAndroid) {
                db = window.sqlitePlugin.openDatabase({ name: 'IAG.db', location: 'default' }, successcb, errorcb);
            }
            else if (isIOS) {
                db = window.sqlitePlugin.openDatabase({ name: 'IAG.db', iosDatabaseLocation: 'Library' }, successcb, errorcb);
            }
            else {
                alert("we cant detect your platform.");
            }
            var successcb = function () {
                console.log("db open: success");
            };
            var errorcb = function (err) {
                console.error("db open: error--> " + err);
            };
        },
        initiate: function () {
            db.sqlBatch([
                "CREATE TABLE IF NOT EXISTS Places\
            (\
            Pla_Id blob PRIMARY KEY,\
            Pla_Name text,\
            Pla_imgUrl text,\
            Pla_TNImgUrl text,\
            Pla_desc text,\
            Pla_c_x real,\
            Pla_c_y real,\
            Pla_address text,\
            Pla_CityId integer,\
            Pla_isPrimary integer,\
            Pla_bookmarked integer,\
            Pla_Dirty_imgUrl integer,\
            Pla_Dirty_TNImgUrl integer\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS Audios\
            (\
            Aud_Id blob PRIMARY KEY,\
            Aud_PlaceId blob,\
            Aud_Name text,\
            Aud_Url text,\
            Aud_desc text,\
            Aud_Dirty integer\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS Stories\
            (\
            Sto_Id blob PRIMARY KEY,\
            Sto_PlaceId blob,\
            Sto_Name text,\
            Sto_Url text,\
            Sto_desc text,\
            Sto_Dirty integer\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS Images\
            (\
            Img_Id blob PRIMARY KEY,\
            Img_PlaceId blob,\
            Img_Url text,\
            Img_desc text,\
            Img_Dirty integer\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS Tips\
            (\
            Tip_Id blob PRIMARY KEY,\
            Tip_PlaceId blob,\
            Tip_CategoryId blob,\
            Tip_Contetnt text\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS Cities\
            (\
            Cit_Id integer PRIMARY KEY,\
            Cit_Name text,\
            Cit_Desc text,\
            Cit_ImageUrl text,\
            Cit_Dirty integer\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS TipCategories\
            (\
            TiC_Id blob PRIMARY KEY,\
            TiC_Class text,\
            TiC_Unicode text,\
            TiC_Name text,\
            Cit_Priiority integer\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS PlayerHistory\
            (\
            PlH_Id integer PRIMARY KEY,\
            PlH_Name text,\
            PlH_isAudio integer,\
            PlH_trackId blob,\
            PlH_PlaceId blob,\
            PlH_Url text\
            )"
            , "\
            CREATE TABLE IF NOT EXISTS AutorizedCities\
            (\
            AuC_Id integer PRIMARY KEY\
            )"], function () {
                console.log('Create database OK');
            }, function (error) {
                console.log('SQL batch ERROR: ' + error.message);
            });
        },
        populatePlaces: function (Places) {
            var query = "INSERT OR REPLACE INTO Places\
                    (Pla_Id,\
                    Pla_Name,\
                    Pla_imgUrl,\
                    Pla_TNImgUrl,\
                    Pla_desc,\
                    Pla_c_x,\
                    Pla_c_y,\
                    Pla_address,\
                    Pla_CityId,\
                    Pla_isPrimary,\
                    Pla_bookmarked,\
                    Pla_Dirty_imgUrl,\
                    Pla_Dirty_TNImgUrl)\
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
            for (var i = 0; i < Places.length; i++) {
                db.executeSql(query, [Places[i].Id
                    , Places[i].Name
                    , Places[i].ImgUrl
                    , Places[i].TNImgUrl
                    , Places[i].Desc
                    , Places[i].CX
                    , Places[i].CY
                    , Places[i].Address
                    , Places[i].CityId
                    , (Places[i].isPrimary) ? 1 : 0
                    , 0
                    , 1
                    , 1],
                    function (res) {
                        $rootScope.waitingUpdates--;
                        $rootScope.$broadcast('CheckWaitingUpdates');
                    },
                    function (error) {
                        console.error('error: ' + error.message);
                    });
                FileServices.DownloadTumbNail(Places[i].TNImgUrl, Places[i].Id);
            }
        },
        populateAudios: function (Audios) {
            var query = "INSERT OR REPLACE INTO Audios\
                    (Aud_Id\
                    ,Aud_PlaceId\
                    ,Aud_Name\
                    ,Aud_Url\
                    ,Aud_desc\
                    ,Aud_Dirty)\
                    VALUES (?,?,?,?,?,?)";
            var AudiosList = [];

            db.transaction(function (tx) {
                for (var i = 0; i < Audios.length; i++) {
                    tx.executeSql(query, [Audios[i].ID
                        , Audios[i].PlaceId
                        , Audios[i].Name
                        , Audios[i].Url
                        , Audios[i].Desc
                        , 1],
                    function (tx, res) {
                        $rootScope.waitingUpdates--;
                        $rootScope.$broadcast('CheckWaitingUpdates');
                    },
                    function (tx, error) {
                        console.error('error: ' + error.message);
                        alert("something went wrong, please restart your application.");
                        ionic.Platform.exitApp();
                    });
                }
            }, function (error) {
                console.log('transaction error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
                return false;
            }, function () {
                //alert(query);
                console.log('transaction ok');
                return true;
            });
            //$cordovaSQLite.execute(db, query,
            //    [Audios[i].ID
            //    , Audios[i].PlaceId
            //    , Audios[i].Name
            //    , Audios[i].Url
            //    , Audios[i].Desc
            //    , 1])
            //    .then(function (result) {
            //        console.log("Audios INSERT ID -> " + result.insertId);
            //    }, function (error) {
            //        console.error(error);
            //    });

        },
        populateStories: function (Stories) {
            var query = "INSERT OR REPLACE INTO Stories\
                    (Sto_Id\
                    ,Sto_PlaceId\
                    ,Sto_Name\
                    ,Sto_Url\
                    ,Sto_desc\
                    ,Sto_Dirty)\
                    VALUES (?,?,?,?,?,?)";
            db.transaction(function (tx) {
                for (var i = 0; i < Stories.length; i++) {
                    tx.executeSql(query,
                        [Stories[i].ID
                        , Stories[i].PlaceId
                        , Stories[i].Name
                        , Stories[i].Url
                        , Stories[i].Desc
                        , 1],
                        function (tx, res) {
                            //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                            $rootScope.waitingUpdates--;
                            $rootScope.$broadcast('CheckWaitingUpdates');
                        },
                        function (tx, error) {
                            console.error('error: ' + error.message);
                            alert("something went wrong, please restart your application.");
                            ionic.Platform.exitApp();
                        });
                }
            }, function (error) {
                console.log('transaction error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
                return false;
            }, function () {
                //alert(query);
                console.log('transaction ok');
                return true;
            });

            //for (var i = 0; i < Stories.length; i++) {
            //    $cordovaSQLite.execute(db, query,
            //        [Stories[i].ID
            //        , Stories[i].PlaceId
            //        , Stories[i].Name
            //        , Stories[i].Url
            //        , Stories[i].Desc
            //        , 1])
            //        .then(function (result) {
            //            console.log("Stories INSERT ID -> " + result.insertId);
            //        }, function (error) {
            //            console.error(error);
            //        });
            //}
        },
        populateImages: function (Images) {
            var query = "INSERT OR REPLACE INTO Images\
                    (Img_Id,\
                    Img_PlaceId,\
                    Img_Url,\
                    Img_desc,\
                    Img_Dirty)\
                    VALUES (?,?,?,?,?)";
            db.transaction(function (tx) {
                for (var i = 0; i < Images.length; i++) {
                    tx.executeSql(query,
                        [Images[i].ID
                        , Images[i].PlaceId
                        , Images[i].Url
                        , Images[i].Desc
                        , 1],
                        function (tx, res) {
                            //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                            $rootScope.waitingUpdates--;
                            $rootScope.$broadcast('CheckWaitingUpdates');
                        },
                        function (tx, error) {
                            console.error('error: ' + error.message);
                            alert("something went wrong, please restart your application.");
                            ionic.Platform.exitApp();
                        });
                }
            }, function (error) {
                console.log('transaction error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
                return false;
            }, function () {
                //alert(query);
                console.log('transaction ok');
                return true;
            });

            //for (var i = 0; i < Images.length; i++) {
            //    $cordovaSQLite.execute(db, query,
            //        [Images[i].ID
            //        , Images[i].PlaceId
            //        , Images[i].Url
            //        , Images[i].Desc
            //        , 1])
            //        .then(function (result) {
            //            console.log("Images INSERT ID -> " + result.insertId);
            //        }, function (error) {
            //            console.error(error);
            //        });
            //}
        },
        populateTips: function (Tips) {
            var query = "INSERT OR REPLACE INTO Tips\
                    (Tip_Id,\
                    Tip_PlaceId,\
                    Tip_CategoryId,\
                    Tip_Contetnt)\
                    VALUES (?,?,?,?)";
            db.transaction(function (tx) {
                for (var i = 0; i < Tips.length; i++) {
                    tx.executeSql(query,
                        [Tips[i].ID
                        , Tips[i].PlaceId
                        , Tips[i].CategoryId
                        , Tips[i].Content],
                        function (tx, res) {
                            //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                            $rootScope.waitingUpdates--;
                            $rootScope.$broadcast('CheckWaitingUpdates');
                        },
                        function (tx, error) {
                            console.error('error: ' + error.message);
                            alert("something went wrong, please restart your application.");
                            ionic.Platform.exitApp();
                        });
                }
            }, function (error) {
                console.log('transaction error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
                return false;
            }, function () {
                //alert(query);
                console.log('transaction ok');
                return true;
            });

            //for (var i = 0; i < Tips.length; i++) {
            //    $cordovaSQLite.execute(db, query,
            //        [Tips[i].ID
            //        , Tips[i].PlaceId
            //        , Tips[i].CategoryId
            //        , Tips[i].Content])
            //        .then(function (result) {
            //            console.log("Tips INSERT ID -> " + result.insertId);
            //        }, function (error) {
            //            console.error(error);
            //        });
            //}
        },
        populateTipCategories: function (TipCategories) {
            var query = "INSERT OR REPLACE INTO TipCategories\
                    (\
                    TiC_Id,\
                    TiC_Class,\
                    TiC_Unicode,\
                    TiC_Name,\
                    Cit_Priiority)\
                    VALUES (?,?,?,?,?)";
            db.transaction(function (tx) {
                for (var i = 0; i < TipCategories.length; i++) {
                    tx.executeSql(query,
                        [TipCategories[i].ID
                        , TipCategories[i].Class
                        , TipCategories[i].Unicode
                        , TipCategories[i].Name
                        , TipCategories[i].Priority],
                        function (tx, res) {
                            //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                            $rootScope.waitingUpdates--;
                            $rootScope.$broadcast('CheckWaitingUpdates');
                        },
                        function (tx, error) {
                            console.error('error: ' + error.message);
                            alert("something went wrong, please restart your application.");
                            ionic.Platform.exitApp();
                        });
                }
            }, function (error) {
                console.log('transaction error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
                return false;
            }, function () {
                //alert(query);
                console.log('transaction ok');
                return true;
            });

            //for (var i = 0; i < TipCategories.length; i++) {
            //    $cordovaSQLite.execute(db, query,
            //        [TipCategories[i].ID
            //        , TipCategories[i].Class
            //        , TipCategories[i].Unicode
            //        , TipCategories[i].Name
            //        , TipCategories[i].Priority])
            //        .then(function (result) {
            //            console.log("TipCategories INSERT ID -> " + result.insertId);
            //        }, function (error) {
            //            console.error(error);
            //        });
            //}
        },
        populateCities: function (Cities) {
            var CityPromises = [];
            var query = "INSERT OR REPLACE INTO Cities\
                    (Cit_Id\
                    ,Cit_Name\
                    ,Cit_Desc\
                    ,Cit_ImageUrl\
                    ,Cit_Dirty)\
                    VALUES (?,?,?,?,?)";
            db.transaction(function (tx) {
                for (var i = 0; i < Cities.length; i++) {
                    tx.executeSql(query,
                        [Cities[i].Id
                        , Cities[i].Name
                        , Cities[i].Desc
                        , Cities[i].ImageUrl
                        , 1],
                        function (tx, res) {
                            $rootScope.waitingUpdates--;
                            $rootScope.$broadcast('CheckWaitingUpdates');
                            //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                        },
                        function (tx, error) {
                            console.error('error: ' + error.message);
                            alert("something went wrong, please restart your application.");
                            ionic.Platform.exitApp();
                        });
                    //CityPromises.push(FileServices.DownloadCityImage(Cities[i].ImageUrl));
                    FileServices.DownloadCityImage(Cities[i].ImageUrl, Cities[i].Id);
                }
            }, function (error) {
                console.log('transaction error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
                return false;
            }, function () {
                //alert(query);
                console.log('transaction ok');
                return true;
            });
            //$q.all(CityPromises).then(function (result) {// Success!
            //    for (var i = 0; i < Cities.length; i++) {
            //        $rootScope.WaitingPrimaryData--;
            //        $rootScope.$broadcast('primaryDataLoaded', {});
            //        $rootScope.$broadcast('callDbServicesFunctions', { functionName: 'CleanCityImage', params: [Cities[i].Id] });
            //    }
            //}, function (err) {// Error
            //    alert("can not connect to server, please restart your application.");
            //    ionic.Platform.exitApp();
            //    console.log(err);
            //}, function (progress) {
            //    //$timeout(function () {
            //    //    $scope.downloadProgress = (progress.loaded / b                                 rogress.total) * 100;
            //    //});
            //});
        },
        populateAutorizedCities: function (Cities) {
            var ph = '';
            var data = [];
            for (var i = 0; i < Cities.length; i++) {
                data.push(Cities[i]);
                if (i !== 0) ph += ',';
                ph += '(?)';
            }
            db.sqlBatch([
                ['INSERT OR REPLACE INTO AutorizedCities (AuC_Id) VALUES ' + ph, data]
            ], function (res) {
                console.log('Populated database OK');
                $rootScope.$broadcast('loadAutorizedCities', {});
            }, function (error) {
                console.error('SQL batch ERROR: ' + error.message);
            });
        },
        removeAudioFiles: function (AudioIds) {
            var stringIDs = AudioIds.map(String);
            var args = stringIDs.join(", ");
            var query = "\
                SELECT Aud_Url\
                FROM Audios\
                WHERE Aud_Id IN (" + args + ")";
            var queryRemove = "\
                DELETE FROM Audios\
                WHERE Aud_Id IN (" + args + ")";
            db.executeSql(query, [],
                function (res) {
                    var result = res.rows;
                    for (var i = 0; i < result.length; i++) {
                        var file = result.item(i).Aud_Url;
                        FileServices.RemoveTrack(file, 1);
                    }
                    db.executeSql(queryRemove, [],
                        function (res) {
                            console.log("Audios removed");
                        },
                        function (error) {
                            console.log("Audios removing failed");
                        });
                },
                function (error) {
                    console.log('error: ' + error.message);
                });
        },
        removeStoryFiles: function (StoryIds) {
            var stringIDs = StoryIds.map(String);
            var args = stringIDs.join(", ");
            var query = "\
                SELECT Sto_Url\
                FROM Stories\
                WHERE Sto_Id IN (" + args + ")";
            var queryRemove = "\
                DELETE FROM Stories\
                WHERE Sto_Id IN (" + args + ")";
            db.executeSql(query, [],
                function (res) {
                    var result = res.rows;
                    for (var i = 0; i < result.length; i++) {
                        var file = result.item(i).Sto_Url;
                        FileServices.RemoveTrack(file, 0);
                    }
                    db.executeSql(queryRemove, [],
                        function (res) {
                            console.log("stories removed");
                        },
                        function (error) {
                            console.log("stories removing failed");
                        });
                },
                function (error) {
                    console.log('error: ' + error.message);
                });

            //$cordovaSQLite.execute(db, query)
            //.then(function (result) {
            //    var res = result.rows;
            //    console.log("to remove stories:", res)
            //    for (var i = 0; i < res.length; i++) {
            //        var file = res.item(i).Sto_Url;
            //        FileServices.RemoveTrack(file, 0);
            //    }
            //}, function (error) {
            //    console.error(error);
            //});
        },
        deleteFromTable: function (tableName, tableIdColumn, IDs) {
            if (IDs.length > 0) {
                paramlist = '?';
                for (var i = 0; i < IDs.length - 1; i++) {
                    paramlist = paramlist + ', ?';
                }
                db.transaction(function (tx) {
                    for (var i = 0; i < IDs.length; i++) {
                        var query = "\
                DELETE FROM " + tableName + "\
                WHERE " + tableIdColumn + " IN (" + paramlist + ")";
                        tx.executeSql(query,
                                IDs,
                        function (tx, res) {
                            console.log("removed from: " + tableName, "rowsAffected: " + res.rowsAffected);
                            $rootScope.waitingUpdates--;
                            $rootScope.$broadcast('CheckWaitingUpdates');
                        },
                        function (tx, error) {
                            alert("something went wrong, please restart your application.");
                            ionic.Platform.exitApp();
                            console.log("removing from: " + tableName + " failed");
                        });
                    }


                }, function (error) {
                    console.log('transaction error: ' + error.message);
                    alert("something went wrong, please restart your application.");
                    ionic.Platform.exitApp();
                }, function () {
                    console.log('transaction ok');
                });
            }

        },
        CleanPlaceTumbnail: function (PlaceID) {
            var query = "\
            UPDATE Places\
            SET Pla_Dirty_TNImgUrl = 0\
            WHERE Pla_Id = ?";
            db.executeSql(query,
                        [PlaceID],
                function (res) {
                    console.log("placeTumbImageCleaned");
                },
                function (error) {
                    console.error("place TumbImage Cleaning failed");
                });
        },
        CleanPlaceImage: function (PlaceID) {
            var query = "\
            UPDATE Places\
            SET Pla_Dirty_imgUrl = 0\
            WHERE Pla_Id = ?";
            db.executeSql(query,
                        [PlaceID],
                function (res) {
                    console.log("placeImageCleaned");
                },
                function (error) {
                    console.error("placeImageCleaning failed");
                });

            //$cordovaSQLite.execute(db, query, [PlaceID])
            //        .then(function (result) {
            //            console.log("placeImageCleaned");
            //        }, function (error) {
            //            console.error(error);
            //        });
        },
        CleanCityImage: function (CityID) {
            var query = "\
            UPDATE Cities\
            SET Cit_Dirty = 0\
            WHERE Cit_Id = ?";
            db.executeSql(query,
                        [CityID],
                function (res) {
                    console.log("CityImageCleaned");
                },
                function (error) {
                    console.error("CityImageCleaning failed");
                });
        },
        CleanPlaceExtraImage: function (ImageId) {
            var query = "\
            UPDATE Images\
            SET Img_Dirty = 0\
            WHERE Img_Id = ?";
            db.executeSql(query,
                        [ImageId],
                function (res) {
                    console.log("placeExtraImageCleaned");
                },
                function (error) {
                    console.log("place ExtraImage Cleaning failed");
                });

            //$cordovaSQLite.execute(db, query, [ImageId])
            //        .then(function (result) {
            //            console.log("placeExtraImageCleaned");
            //        }, function (error) {
            //            console.error(error);
            //        });
        },
        CleanStory: function (StoryId) {
            var query = "\
            UPDATE Stories\
            SET Sto_Dirty = 0\
            WHERE Sto_Id = ?";
            db.executeSql(query,
                        [StoryId],
                function (res) {
                    console.log("Story Cleaned");
                },
                function (error) {
                    console.log("Story Cleaning failed");
                });
        },
        CleanAudio: function (AudioId) {
            var query = "\
            UPDATE Audios\
            SET Aud_Dirty = 0\
            WHERE Aud_Id = ?";
            db.executeSql(query,
                        [AudioId],
                function (res) {
                    console.log("Audio Cleaned");
                },
                function (error) {
                    console.log("Audio Cleaning failed");
                });

            //$cordovaSQLite.execute(db, query, [AudioId])
            //        .then(function (result) {
            //            console.log("Audio Cleaned: ", result);
            //        }, function (error) {
            //            console.error(error);
            //        });
        },
        DirtyStory: function (StoryId) {
            var queryDelete = "DELETE FROM PlayerHistory\
            WHERE PlH_trackId = ?\
                AND PlH_isAudio = 0"
            var query = "\
            UPDATE Stories\
            SET Sto_Dirty = 1\
            WHERE Sto_Id = ?";
            db.transaction(function (tx) {
                tx.executeSql(queryDelete,
                    [StoryId],
                    function (tx, res) {
                        tx.executeSql(query,
                            [StoryId],
                            function (tx, res) {
                                $rootScope.$broadcast('PlayerHistoryUpdated', {});
                                console.log("Story dirtied");
                            },
                            function (tx, error) {
                                console.error('Story dirtying failed: ' + error.message);
                            });
                    },
                    function (tx, error) {
                        console.error('error: ' + error.message);
                    });

            }, function (error) {
                console.error('transaction error: ' + error.message);
            }, function () {
                console.log("Done.");
            });
        },
        DirtyAudio: function (AudioId) {
            var queryDelete = "DELETE FROM PlayerHistory\
            WHERE PlH_trackId = ?\
                AND PlH_isAudio = 1"
            var query = "\
            UPDATE Audios\
            SET Aud_Dirty = 1\
            WHERE Aud_Id = ?";
            db.transaction(function (tx) {
                tx.executeSql(queryDelete,
                    [AudioId],
                    function (tx, res) {
                        tx.executeSql(query,
                            [AudioId],
                            function (tx, res) {
                                $rootScope.$broadcast('PlayerHistoryUpdated', {});
                                console.log("Audio dirtied");
                            },
                            function (tx, error) {
                                console.error('Audio dirtying failed: ' + error.message);
                            });
                    },
                    function (tx, error) {
                        console.error('error: ' + error.message);
                    });

            }, function (error) {
                console.error('transaction error: ' + error.message);
            }, function () {
                console.log("Done.");
            });
        },
        bookmarkePlace: function (PlaceID) {
            var id = PlaceID;
            var query = "\
            UPDATE Places\
            SET Pla_bookmarked = 1\
            WHERE Pla_Id = ?";
            db.executeSql(query, [id],
                function (res) {
                    $rootScope.$broadcast('PlaceBookmarked', { placeId: id });
                },
                function (error) {
                    console.log("Place bookmarking failed");
                });

            //return $cordovaSQLite.execute(db, query, [PlaceID]);
        },
        unbookmarkePlace: function (PlaceID) {
            var id = PlaceID;
            var query = "\
            UPDATE Places\
            SET Pla_bookmarked = 0\
            WHERE Pla_Id = ?";
            db.executeSql(query, [id],
                function (res) {
                    $rootScope.$broadcast('PlaceUnbookmarked', { placeId: id });
                    console.log("Place unbookmarked");
                },
                function (error) {
                    console.log("Place bookmarking failed");
                });

            //return $cordovaSQLite.execute(db, query, [PlaceID]);
        },
        LoadAllCities: function () {
            var query = "\
                SELECT\
                    Cit_Id,\
                    Cit_Name,\
                    Cit_Desc,\
                    Cit_ImageUrl\
                FROM Cities";
            db.executeSql(query, [],
            function (res) {
                $rootScope.$broadcast('FillCities', { result: res });
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });

            //$cordovaSQLite.execute(db, query).then(function (result) {
            //    $rootScope.$broadcast('FillCities', { result: result });
            //}, function (error) {
            //    console.error(error);
            //});
        },
        LoadAllPlaces: function () {
            var query = "\
                SELECT\
                    Pla_Id,\
                    Pla_Name,\
                    Pla_TNImgUrl,\
                    Pla_imgUrl,\
                    Pla_address,\
                    Pla_bookmarked,\
                    Cit_Name,\
                    Pla_CityId\
                FROM Places JOIN Cities\
                ON Places.Pla_CityId = Cities.Cit_Id";
            db.executeSql(query, [],
            function (res) {
                $rootScope.$broadcast('FillPlaces', { result: res });
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });

            //$cordovaSQLite.execute(db, query).then(function (result) {
            //    $rootScope.$broadcast('FillPlaces', { result: result });
            //}, function (error) {
            //    console.error(error);
            //});
        },
        LoadPrimaryPlaces: function () {
            var query = "\
                SELECT\
                    Pla_Id,\
                    Pla_Name,\
                    Pla_TNImgUrl,\
                    Pla_imgUrl,\
                    Pla_address,\
                    Pla_bookmarked,\
                    Cit_Name,\
                    Pla_CityId\
                FROM Places JOIN Cities\
                ON Places.Pla_CityId = Cities.Cit_Id\
                WHERE Places.Pla_isPrimary = 1";
            db.executeSql(query, [],
            function (res) {
                $rootScope.$broadcast('PrimaryPlacesLoaded', { result: res });
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });

            //return $cordovaSQLite.execute(db, query);
        },
        LoadBookmarkedPlaces: function () {
            var query = "\
                SELECT\
                    Pla_Id,\
                    Pla_Name,\
                    Pla_TNImgUrl,\
                    Pla_imgUrl,\
                    Pla_address,\
                    Pla_bookmarked,\
                    Cit_Name,\
                    Pla_CityId\
                FROM Places JOIN Cities\
                ON Places.Pla_CityId = Cities.Cit_Id\
                WHERE Places.Pla_bookmarked = 1";
            db.executeSql(query, [],
            function (res) {
                $rootScope.$broadcast('BookmarkedPlacesLoaded', { result: res });
            },
            function (error) {
                console.log('error: ' + error.message);
            });
        },
        LoadPlaceInfos: function (Id, isFromBookmark) {
            var isPlaceForBookmark = isFromBookmark || 0;
            var query = "\
                SELECT *\
                FROM Places\
                WHERE Pla_Id = ?";
            db.executeSql(query, [Id],
            function (res) {
                if (isPlaceForBookmark == 1) {
                    $rootScope.$broadcast('PlaceInfoesLoaded_bookmark', { result: res });
                }
                else {
                    $rootScope.$broadcast('PlaceInfoesLoaded', { result: res });
                }
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });
        },
        LoadPlaceAudios: function (PlaceId, isFromBookmark) {
            var isAudioForBookmark = isFromBookmark || 0;
            var query = "\
                SELECT *\
                FROM Audios\
                WHERE Aud_PlaceId = ?";
            db.executeSql(query, [PlaceId],
            function (res) {
                if (isAudioForBookmark == 1) {
                    $rootScope.$broadcast('PlaceAudiosLoaded_bookmark', { result: res });
                }
                else {
                    $rootScope.$broadcast('PlaceAudiosLoaded', { result: res });
                }
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });
        },
        LoadPlaceStories: function (PlaceId, isFromBookmark) {
            var isStoryForBookmark = isFromBookmark || 0;
            var query = "\
                SELECT *\
                FROM Stories\
                WHERE Sto_PlaceId = ?";
            db.executeSql(query, [PlaceId],
            function (res) {
                if (isStoryForBookmark == 1) {
                    $rootScope.$broadcast('PlaceStoriesLoaded_bookmark', { result: res });
                }
                else {
                    $rootScope.$broadcast('PlaceStoriesLoaded', { result: res });
                }
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });
        },
        LoadPlaceImages: function (PlaceId, isFromBookmark) {
            var isImageForBookmark = isFromBookmark || 0;
            var query = "\
                SELECT *\
                FROM Images\
                WHERE Img_PlaceId = ?";
            db.executeSql(query, [PlaceId],
            function (res) {
                if (isImageForBookmark == 1) {
                    $rootScope.$broadcast('PlaceImagesLoaded_bookmark', { result: res });
                }
                else {
                    $rootScope.$broadcast('PlaceImagesLoaded', { result: res });
                }
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });
        },
        LoadPlaceTips: function (PlaceId, isFromBookmark) {
            var isTipForBookmark = isFromBookmark || 0;
            var query = "\
                SELECT Tip_Id, TiC_Class, Tip_Contetnt\
                FROM Tips JOIN TipCategories\
                ON Tips.Tip_CategoryId = TipCategories.TiC_Id\
                WHERE Tip_PlaceId = ?\
                ORDER BY\
                    Cit_Priiority ASC,\
                    Tip_Id ASC;";
            db.executeSql(query, [PlaceId],
            function (res) {
                if (isTipForBookmark == 1) {
                    $rootScope.$broadcast('PlaceTipsLoaded_bookmark', { result: res });
                }
                else {
                    $rootScope.$broadcast('PlaceTipsLoaded', { result: res });
                }
            },
            function (error) {
                console.log('error: ' + error.message);
                alert("something went wrong, please restart your application.");
                ionic.Platform.exitApp();
            });
        },
        AddToPlayerHistory: function (PH) {
            var queryDelete = "DELETE FROM PlayerHistory\
            WHERE PlH_trackId = ?\
                AND PlH_isAudio = ?"
            var query = "INSERT INTO PlayerHistory\
                    (PlH_Name,\
                    PlH_isAudio,\
                    PlH_trackId,\
                    PlH_PlaceId,\
                    PlH_Url)\
                    VALUES (?,?,?,?,?)";
            db.transaction(function (tx) {
                tx.executeSql(queryDelete,
                    [PH.trackId,
                    PH.isAudio],
                    function (tx, res) {
                        tx.executeSql(query,
                            [PH.name,
                            PH.isAudio,
                            PH.trackId,
                            PH.placeId,
                            PH.url],
                            function (tx, res) {
                                $rootScope.$broadcast('PlayerHistoryUpdated', {});
                            },
                            function (tx, error) {
                                console.error('error: ' + error.message);
                            });
                    },
                    function (tx, error) {
                        console.error('error: ' + error.message);
                    });

            }, function (error) {
                console.error('transaction error: ' + error.message);
            }, function () {
                console.log("Done.");
            });
        },
        LoadTopPlayerHistory: function () {
            var query = "\
                SELECT *\
                FROM (\
                    SELECT *\
                    FROM PlayerHistory\
                    ORDER BY PlH_Id ASC LIMIT 10)\
                ORDER BY PlH_Id DESC";
            db.transaction(function (tx) {
                tx.executeSql(query, [],
                function (tx, res) {
                    $rootScope.$broadcast('FillPlayerHistory', { result: res });
                },
                function (tx, error) {
                    console.error('error: ' + error.message);
                });
            }, function (error) {
                console.error('transaction error: ' + error.message);
            }, function () {
                console.log("Done.");
            });
        },
        test: function () {
            var placeId = "810b44cb-b8d8-e611-80c5-d4ae52c647ec";
            db.transaction(function (tx) {
                var query = "select * from Places where Pla_Id = ?";

                tx.executeSql(query, [placeId], function (tx, resultSet) {
                    console.log("test1 completed.");

                    for (var i = 0; i < resultSet.rows.length; i++) {
                        console.log("test primary " + i + ": ", resultSet.rows.item(i).Pla_Id);
                    }

                    var queryRm = "DELETE FROM Places WHERE Pla_Id = ?";

                    tx.executeSql(queryRm, [placeId], function (tx, res) {
                        console.log("removeId: " + res.insertId);
                        console.log("rowsAffected: " + res.rowsAffected);

                        tx.executeSql(query, [placeId], function (tx, resultSet) {
                            console.log("test2 completed.");
                            for (var i = 0; i < resultSet.rows.length; i++) {
                                console.log("test2 primary " + i + ": ", resultSet.rows.item(i).Pla_Id);
                            }

                        },
                        function (tx, error) {
                            console.log('SELECT error: ' + error.message);
                        });


                    },
                    function (tx, error) {
                        console.log('DELETE error: ' + error.message);
                    });

                },
                function (tx, error) {
                    console.log('SELECT error: ' + error.message);
                });



            }, function (error) {
                console.log('transaction error: ' + error.message);
            }, function () {
                console.log('transaction ok');
            });
        }
    }
}])
.service('FileServices', ['$rootScope', '$cordovaFile', '$cordovaFileTransfer', function ($rootScope, $cordovaFile, $cordovaFileTransfer) {
    return {
        createDirs: function () {
            Dirs = ["TumbNameil_dir", "PlacePic_dir", "PlaceAudio_dir", "PlaceStory_dir", "Extras_dir", "ProfilePic_dir", "Cities_dir"];
            for (var i = 0; i < Dirs.length; i++) {
                $cordovaFile.createDir(cordova.file.dataDirectory, Dirs[i], false)
                  .then(function (success) {
                      console.log(success);
                  }, function (error) {
                      console.log(error);
                  });
            }
        },
        DownloadExtraImage: function (fileName, ImageId, imgDesc, isFromBookmark) {
            var isDownloadExtraImageForBookmark = isFromBookmark || 0;
            var url = "http://iranaudioguide.com/images/Places/Extras/" + fileName;
            var targetPath = cordova.file.dataDirectory + "/Extras_dir/" + fileName;
            var trustHosts = true;
            var options = {};

            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
                .then(function (result) {// Success!
                    if (isDownloadExtraImageForBookmark == 1) {
                        $rootScope.$broadcast('PlaceExtraImageDownloaded_bookmark', {
                            Img_Url: targetPath,
                            Img_Id: ImageId,
                            Img_desc: imgDesc
                        });
                    }
                    else {
                        $rootScope.$broadcast('PlaceExtraImageDownloaded', {
                            Img_Url: targetPath,
                            Img_Id: ImageId,
                            Img_desc: imgDesc
                        });
                    }
                }, function (err) {// Error
                    if (isDownloadExtraImageForBookmark == 1) {
                        $rootScope.$broadcast('PlaceExtraImageDownloadFailed_bookmark', {});
                    }
                    else {
                        $rootScope.$broadcast('PlaceExtraImageDownloadFailed', {});
                    }
                    console.error(err);
                }, function (progress) {
                    //$timeout(function () {
                    //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                    //});
                });
        },
        DownloadTumbNail: function (fileName, placeId) {
            console.log('star: ' + fileName);
            var url = "http://iranaudioguide.com/images/Places/TumbnailImages/" + fileName;
            var targetPath = cordova.file.dataDirectory + "/TumbNameil_dir/" + fileName;
            var trustHosts = true;
            var options = {};

            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
              .then(function (result) {
                  $rootScope.waitingUpdates--;
                  $rootScope.$broadcast('CheckWaitingUpdates');
                  $rootScope.$broadcast('callDbServicesFunctions', { functionName: 'CleanPlaceTumbnail', params: [placeId] });
                  // Success!
              }, function (err) {
                  console.log(err);
                  alert("can not connect to server, please restart your application.");
                  ionic.Platform.exitApp();
                  // Error
              }, function (progress) {
                  //$timeout(function () {
                  //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                  //});
              });
        },
        DownloadPlaceImage: function (fileName, placeId) {
            var url = "http://iranaudioguide.com/images/Places/" + fileName;
            var targetPath = cordova.file.dataDirectory + "/PlacePic_dir/" + fileName;
            var trustHosts = true;
            var options = {};

            return $cordovaFileTransfer.download(url, targetPath, options, trustHosts);
            //.then(function (result) {// Success!
            //    //dbServices.CleanPlaceImage(placeId);
            //    $rootScope.$broadcast('callDbServicesFunctions', { functionName: 'CleanPlaceImage', params: [placeId] });
            //    $rootScope.$broadcast('PlaceImageDownloaded', { PlaceImgPath: targetPath });
            //}, function (err) {// Error
            //    console.log(err);
            //}, function (progress) {
            //    //$timeout(function () {
            //    //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
            //    //});
            //});
        },
        DownloadCityImage: function (fileName, id) {
            var url = "http://iranaudioguide.com/images/Cities/" + fileName;
            var targetPath = cordova.file.dataDirectory + "/Cities_dir/" + fileName;
            var trustHosts = true;
            var options = {};

            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
            .then(function (result) {// Success!
                $rootScope.waitingUpdates--;
                $rootScope.$broadcast('CheckWaitingUpdates');
                $rootScope.$broadcast('callDbServicesFunctions', { functionName: 'CleanCityImage', params: [id] });
            }, function (err) {// Error
                console.log(err);
                alert("can not connect to server, please restart your application.");
                ionic.Platform.exitApp();
            }, function (progress) {
                //$timeout(function () {
                //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                //});
            });

            //return $cordovaFileTransfer.download(url, targetPath, options, trustHosts);
        },
        DownloadProfilePic: function (url, dest) {
            console.log(url);
            console.log(dest);
            var targetPath = cordova.file.dataDirectory + "/ProfilePic_dir/" + dest;
            var trustHosts = true;
            var options = {};
            window.localStorage.setItem("Authenticated", true);
            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
              .then(function (result) {
                  window.localStorage.setItem("User_Img", targetPath);
                  $rootScope.$broadcast('loadProfilePicCommpleted');
                  // Success!
              }, function (err) {
                  $rootScope.$broadcast('loadProfilePicFailed');
                  // Error
              }, function (progress) {
                  //$timeout(function () {
                  //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                  //});
              });
        },
        DownloadAudio: function (fileName) {
            var url = "http://iranaudioguide.com/Audios/" + fileName;
            var targetPath = cordova.file.dataDirectory + "/PlaceAudio_dir/" + fileName;
            var trustHosts = true;
            var options = {};

            return $cordovaFileTransfer.download(url, targetPath, options, trustHosts);
        },
        DownloadStory: function (fileName) {
            var url = "http://iranaudioguide.com/Stories/" + fileName;
            var targetPath = cordova.file.dataDirectory + "/PlaceStory_dir/" + fileName;
            var trustHosts = true;
            var options = {};

            return $cordovaFileTransfer.download(url, targetPath, options, trustHosts);
        },
        RemoveTrack: function (file, isAudio) {
            var path;
            if (isAudio)
                path = cordova.file.dataDirectory + "/PlaceAudio_dir/";
            else
                path = cordova.file.dataDirectory + "/PlaceStory_dir/";

            $cordovaFile.checkFile(path, file)
                .then(function (success) {
                    $cordovaFile.removeFile(path, file)
                        .then(function (success) {
                            console.log("fileRemoved", success);
                        }, function (error) {
                            console.log("file Removing failed", error);
                            // error
                        });
                }, function (error) {
                    console.log("file not found", error);
                });
        },
        RemovePlaceTrack: function (file, isAudio, idx, id) {
            var isAudioToRemove = isAudio;
            var removeIdx = idx;
            var rmvId = id;
            var path;
            if (isAudio)
                path = cordova.file.dataDirectory + "/PlaceAudio_dir/";
            else
                path = cordova.file.dataDirectory + "/PlaceStory_dir/";

            $cordovaFile.checkFile(path, file)
                .then(function (success) {
                    $cordovaFile.removeFile(path, file)
                    .then(function (success) {
                        console.log("fileRemoved", success);
                        $rootScope.$broadcast('fileRemoved', { idx: removeIdx, isAudio: isAudioToRemove, id: rmvId });
                    }, function (error) {
                        console.log("file Removing failed", error);
                        // error
                    });
                }, function (error) {
                    $rootScope.$broadcast('fileRemoved', { idx: removeIdx, isAudio: isAudioToRemove, id: rmvId });
                });
        }
    }
}])
.service('Popup', ['$rootScope', '$ionicPopup', function ($rootScope, $ionicPopup) {
    return {
        confirm: function (title, template, callBack) {
            var confirmPopup = $ionicPopup.confirm({
                title: title,
                template: template
            });

            confirmPopup.then(callBack);
        },
        alert: function (title, template, callBack) {
            var alertPopup = $ionicPopup.alert({
                title: title,
                template: template
            });

            alertPopup.then(callBack);
        }
    }
}]);

