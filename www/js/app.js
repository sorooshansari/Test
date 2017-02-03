
angular.module('app', ['ionic', 'ionic.service.core', 'app.controllers', 'app.routes', 'app.services', 'app.directives', 'ngCordova', 'ngCordovaOauth'])

.run(function ($ionicPlatform, $rootScope, $ionicLoading, $ionicHistory, $timeout, $ionicSideMenuDelegate, $state, $interval, AuthServices, dbServices, player, appPrimaryData) {
    $ionicPlatform.ready(function () {
        StatusBar.backgroundColorByHexString('#15437f');
        //checkConnection();

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        $rootScope.audio = {};
        $rootScope.audio.media = null;
    });
    $ionicPlatform.on('resume', function () {

    });
    $ionicPlatform.on('pause', function () {
        var info = player.info();
        if (info.hasMedia) {
            var lastTrackInfo = {
                name: info.trackInfo.Name,
                isAudio: (info.isAudio) ? 1 : 0,
                trackId: info.trackInfo.Id,
                placeId: info.PlaceId,
                url: info.trackInfo.url
            };
            dbServices.AddToPlayerHistory(lastTrackInfo);
        }
    });

    //sidePlayer
    $rootScope.SPtracks = [];
    $rootScope.$on('PlayerHistoryUpdated', function (event) {
        dbServices.LoadTopPlayerHistory();
    });
    $rootScope.$on('FillPlayerHistory', function (event, Data) {
        var res = Data.result.rows;
        var tracks = [];
        for (var i = 0; i < res.length; i++) {
            var newTrack = {
                Id: res.item(i).PlH_trackId,
                Name: res.item(i).PlH_Name,
                url: res.item(i).PlH_Url,
                isAudio: res.item(i).PlH_isAudio,
                placeId: res.item(i).PlH_PlaceId,
                playing: false
            };
            var info = player.info();
            if (info.hasMedia &&
                res.item(i).PlH_trackId == info.trackInfo.Id) {
                newTrack.playing = info.playing;
            }
            tracks.push(newTrack);
        }
        $rootScope.SPtracks = tracks;
    });
    var mediaPercent = function (p, t) {
        return parseInt((p / t) * 100);
    };
    var setTrackPlaying = function (id) {
        for (var i = 0; i < $rootScope.SPtracks.length; i++) {
            if ($rootScope.SPtracks[i].Id == id)
                $rootScope.SPtracks[i].playing = true;
            else
                $rootScope.SPtracks[i].playing = false;
        }
    };
    $rootScope.loadSPtrack = function (trakInfo) {
        var info = player.info();
        if (info.hasMedia &&
            trakInfo.Id == info.trackInfo.Id) {
            if (trakInfo.playing) {
                player.pause();
            }
            else {
                player.play();
            }
        }
        else {
            var track = {
                Id: trakInfo.Id,
                Name: trakInfo.Name,
                url: trakInfo.url,
                description: '',
                downloaded: true,
                downloadProgress: 0,
                downloading: false,
                playing: false
            }
            player.New(track, trakInfo.isAudio, 0, trakInfo.placeId);
            player.play();
        }
    }
    $rootScope.SPduration = 0;
    $rootScope.SPposition = 0;
    $rootScope.SPinfo = player.info();
    $rootScope.SPrange = 0;
    $rootScope.$on('playerUpdated', function () {
        $rootScope.SPinfo = player.info();
        $rootScope.SPposition = player.getPos();
        $rootScope.SPrange = mediaPercent($rootScope.SPposition, $rootScope.SPinfo.duration);
        for (var i = 0; i < $rootScope.SPtracks.length; i++) {
            if ($rootScope.SPtracks[i].Id == $rootScope.SPinfo.trackInfo.Id)
                $rootScope.SPtracks[i].playing = $rootScope.SPinfo.playing;
            else
                $rootScope.SPtracks[i].playing = false;
        }
    });
    $rootScope.$on('positionUpdated', function (event, data) {
        $rootScope.SPposition = data.position;
        $rootScope.SPrange = mediaPercent(data.position, $rootScope.SPinfo.duration);
    });
    $rootScope.SPchooseClass = function (isPlaying) {
        return (isPlaying) ? 'ion-pause' : 'ion-play';
    };
    $rootScope.SPplayPause = function () {
        if (!$rootScope.SPinfo.hasMedia) {
            if ($rootScope.SPtracks.length > 0) {
                $rootScope.loadSPtrack($rootScope.SPtracks[0]);
            }
        }
        else {
            if ($rootScope.SPinfo.playing)
                player.pause();
            else
                player.play();
        }
    };
    $rootScope.MMSS = function (t) {
        var minutes = parseInt(t / 60) % 60;
        var seconds = t % 60;
        return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    };
    $rootScope.stepBackward = function () {
        var t = ($rootScope.SPposition > 10) ? ($rootScope.SPposition - 10) * 1000 : 0;
        player.seekTo(t);
    };

    $rootScope.stepForward = function () {
        var t = ($rootScope.SPinfo.duration - $rootScope.SPposition > 10) ? ($rootScope.SPposition + 10) * 1000 : $rootScope.SPinfo.duration * 1000 - 1;
        player.seekTo(t);
    };
    $rootScope.SPrangeChanged = function () {
        var t = ($rootScope.SPrange * 10) * $rootScope.SPinfo.duration;
        console.log("range changed", t);
        player.seekTo(t);
    };

    $rootScope.$on('loadProfilePicCommpleted', function (event) {
        $ionicLoading.hide();
        console.log("loadProfilePicCommpleted");
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        window.localStorage.setItem("Skipped", false);
        window.localStorage.setItem("Authenticated", true);
        console.log("Go to Primary Page");
        $state.go('primaryPage', null, { reload: true });
    });
    $rootScope.$on('loadProfilePicFailed', function (event) {
        $ionicLoading.hide();
        console.log("loadProfilePicFailed");
        window.localStorage.setItem("User_Img", 'img/defaultProfile.png');
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        alert("loading profile pic failed.")
        window.localStorage.setItem("Skipped", false);
        window.localStorage.setItem("Authenticated", true);
        console.log("Go to Primary Page");
        $state.go('primaryPage', null, { reload: true });
    });
    $rootScope.$on('LoadDefaultUser', function () {
        console.log("Load Default User");
        window.localStorage.setItem("User_Name", "");
        window.localStorage.setItem("User_Img", 'img/defaultProfile.png');
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        $ionicLoading.hide();
        window.localStorage.setItem("Skipped", false);
        window.localStorage.setItem("Authenticated", true);
        console.log("Go to Primary Page");
        $state.go('primaryPage', null, { reload: true });
    });
    $rootScope.Skip = function () {
        var isSkipped = window.localStorage.getItem("Skipped") || "false";
        if (isSkipped == "false") {
            window.localStorage.setItem("User_Name", "");
            window.localStorage.setItem("User_Img", 'img/defaultProfile.png');
            window.localStorage.setItem("Authenticated", false);
            window.localStorage.setItem("Skipped", true);
            window.localStorage.setItem("isToturialSaw", true);
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('primaryPage', null, { reload: true });
        }
        else {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('tabsController.home', null, {});
        }
    };
    $rootScope.logOut = function () {
        AuthServices.logOut();
    }
    $rootScope.$on('CleareUserInfo', function (event) {
        $ionicLoading.show({ template: 'Loading...' });
        window.localStorage.setItem("User_Name", "");
        window.localStorage.setItem("User_Img", 'img/defaultProfile.png');
        window.localStorage.setItem("User_Name", "");
        window.localStorage.setItem("User_Email", "");
        window.localStorage.setItem("User_GoogleId", "");
        window.localStorage.setItem("Authenticated", "false");
        window.localStorage.setItem("Skipped", "true");
        $timeout(function () {
            $ionicLoading.hide();
            $rootScope.Authenticated = false;
            $rootScope.Skipped = true;
            $rootScope.User_Img = 'img/defaultProfile.png';
            $rootScope.User_Name = "";
            $rootScope.User_GoogleId = "";
            $rootScope.User_Email = "";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('login');
        }, 1500);
        $rootScope.inAppRefresh = "true";
        appPrimaryData.init();
    });
    //$rootScope.SkipToturial = function () {
    //    console.log("Toturial skiped");
    //    window.localStorage.setItem("isToturialSaw", true);
    //    $ionicHistory.nextViewOptions({
    //        disableBack: true
    //    });
    //    console.log("Go to Primary Page");
    //    $state.go('primaryPage', null, { reload: true });
    //};
    //$rootScope.SkipToturialShow = false;
    //$rootScope.toturialSlideHasChanged = function (index) {
    //    if (index == 2)
    //        $rootScope.SkipToturialShow = true;
    //}
    
    
    $rootScope.RegisterUser = function () {
        $ionicSideMenuDelegate.toggleRight(0);
        $state.go("signup");
    };
    $rootScope.LoginUser = function () {
        $ionicSideMenuDelegate.toggleRight(0);
        $state.go("login");
    };
    $rootScope.googleLogin = function () {
        console.log("google");
        $ionicLoading.show({ template: 'Loading...' });
        AuthServices.SignInWithGoogle();
    };
    $rootScope.ShowPackage = function () {
        $ionicHistory.nextViewOptions({
            disableBack: false
        });
        $state.go('packages');
    };
    $rootScope.$on('callDbServicesFunctions', function (event, Data) {
        switch (Data.functionName) {
            case 'CleanPlaceImage':
                dbServices.CleanPlaceImage(Data.params[0]);
                break;
            case 'CleanPlaceTumbnail':
                dbServices.CleanPlaceTumbnail(Data.params[0]);
                break;
            case 'CleanPlaceExtraImage':
                dbServices.CleanPlaceExtraImage(Data.params[0]);
                break;
            case 'CleanCityImage':
                console.log("CleanCityImage param:", Data.params[0]);
                dbServices.CleanCityImage(Data.params[0]);
                break;
            default:
                break;
        }
    });
    $rootScope.$on('PopulateAutorizedCities', function (event, Data) {
        dbServices.populateAutorizedCities(Data.cities);
    });
    $rootScope.$on('loadAutorizedCities', function () {
        appPrimaryData.init();
    });
});
function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';

    alert('Connection type: ' + states[networkState]);
}

