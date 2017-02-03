angular.module('app.controllers', [])
.controller('primaryPageCtrl', function ($scope, $rootScope, $ionicPlatform, ApiServices, dbServices, FileServices, $ionicHistory, $state, appPrimaryData, AuthServices, $timeout) {
    console.log("Primary Page");
    var start = 0, end = 0, SplashTime = 5000;
    var updateNumber = 0;
    var pageFirstVisit = true;
    $ionicPlatform.ready(function () {
        if (pageFirstVisit) {
            pageFirstVisit = false;
            dbServices.openDB();
            loadApp();
        }
    });
    $scope.$on('$ionicView.beforeEnter', function () {
        if (!pageFirstVisit) {
            loadApp();
        }
    });
    //$scope.$on('$ionicView.enter', function () {
    //    console.log("primary page before enter");
    //});
    var loadApp = function () {
        start = new Date().getTime();
        AutenticateAndLoadData();
    };
    var fillMenu = function () {
        $rootScope.Authenticated = window.localStorage.getItem("Authenticated") || "false";
        $rootScope.Skipped = window.localStorage.getItem("Skipped") || "false";
        $rootScope.User_Img = window.localStorage.getItem("User_Img");
        $rootScope.User_Name = window.localStorage.getItem("User_Name");
        $rootScope.User_GoogleId = window.localStorage.getItem("User_GoogleId") || '';
        $rootScope.User_Email = window.localStorage.getItem("User_Email");
    };

    var AutenticateAndLoadData = function () {
        var Skipped = window.localStorage.getItem("Skipped") || "false";
        var Authenticated = window.localStorage.getItem("Authenticated") || "false";
        console.log("Authenticated", Authenticated);
        if (Authenticated == "false" && Skipped == "false") {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('toturials');
        }
        else {
            fillMenu();
            var LstUpdtNum = window.localStorage.getItem("LastUpdateNumber") || 0;
            if (LstUpdtNum == 0) {
                FileServices.createDirs();
                dbServices.initiate();
                var networkState = navigator.connection.type;
                while (networkState == Connection.NONE) {
                    alert('check internet connection');
                    networkState = navigator.connection.type;
                }
                //$cordovaDialogs.alert('check your internet connection and try again.', 'Network error', 'Try again')
                ApiServices.GetAll(0);
            }
            else {
                if (navigator.connection.type == Connection.NONE)
                    appPrimaryData.init();
                else {
                    ApiServices.GetAll(LstUpdtNum);
                }
            }
        }
    };
    $rootScope.$on('PopulateTables', function (event, Data) {
        updateNumber = Data.Data.UpdateNumber;
        var waitingUpdates = 2 * Data.Data.Cities.length;
        waitingUpdates += 2 * Data.Data.Places.length;
        waitingUpdates += Data.Data.Audios.length;
        waitingUpdates += Data.Data.Stories.length;
        waitingUpdates += Data.Data.Images.length;
        waitingUpdates += Data.Data.Tips.length;
        waitingUpdates += Data.Data.TipCategories.length;
        $rootScope.waitingUpdates = waitingUpdates;
        if ($rootScope.waitingUpdates != 0) {
            if (Data.Data.Cities.length) {
                dbServices.populateCities(Data.Data.Cities);
            }
            if (Data.Data.Places.length) {
                dbServices.populatePlaces(Data.Data.Places);
            }
            if (Data.Data.Audios.length) {
                dbServices.populateAudios(Data.Data.Audios);
            }
            if (Data.Data.Stories.length) {
                dbServices.populateStories(Data.Data.Stories);
            }
            if (Data.Data.Images.length) {
                dbServices.populateImages(Data.Data.Images);
            }
            if (Data.Data.Tips.length) {
                dbServices.populateTips(Data.Data.Tips);
            }
            if (Data.Data.TipCategories.length) {
                dbServices.populateTipCategories(Data.Data.TipCategories);
            }
        }
        else {
            $rootScope.$broadcast('CheckWaitingUpdates');
        }
    });
    var DelRemovedEntities = function (RemovedEntries) {
        if (RemovedEntries.Cities.length) {
            dbServices.deleteFromTable('Cities', 'Cit_Id', RemovedEntries.Cities);
        }
        if (RemovedEntries.Places.length) {
            dbServices.deleteFromTable('Places', 'Pla_Id', RemovedEntries.Places);
        }
        if (RemovedEntries.Audios.length) {
            dbServices.removeAudioFiles(RemovedEntries.Audios);
            dbServices.deleteFromTable('Audios', 'Aud_Id', RemovedEntries.Audios);
        }
        if (RemovedEntries.Stories.length) {
            dbServices.removeStoryFiles(RemovedEntries.Stories);
            dbServices.deleteFromTable('Stories', 'Sto_Id', RemovedEntries.Stories);
        }
        if (RemovedEntries.Images.length) {
            dbServices.deleteFromTable('Images', 'Img_Id', RemovedEntries.Images);
        }
        if (RemovedEntries.Tips.length) {
            dbServices.deleteFromTable('Tips', 'Tip_Id', RemovedEntries.Tips);
        }
    };
    $rootScope.$on('UpdateTables', function (event, Data) {
        updateNumber = Data.Data.UpdateNumber;
        var waitingUpdates = 2 * Data.Data.Cities.length;
        waitingUpdates += 2 * Data.Data.Places.length;
        waitingUpdates += Data.Data.Audios.length;
        waitingUpdates += Data.Data.Stories.length;
        waitingUpdates += Data.Data.Images.length;
        waitingUpdates += Data.Data.Tips.length;
        waitingUpdates += Data.Data.RemovedEntries.Cities.length;
        waitingUpdates += Data.Data.RemovedEntries.Places.length;
        waitingUpdates += Data.Data.RemovedEntries.Audios.length;
        waitingUpdates += Data.Data.RemovedEntries.Stories.length;
        waitingUpdates += Data.Data.RemovedEntries.Images.length;
        waitingUpdates += Data.Data.RemovedEntries.Tips.length;
        $rootScope.waitingUpdates = waitingUpdates;
        if ($rootScope.waitingUpdates != 0) {
            if (Data.Data.Cities.length) {
                dbServices.populateCities(Data.Data.Cities);
            }
            if (Data.Data.Places.length) {
                dbServices.populatePlaces(Data.Data.Places);
            }
            if (Data.Data.Audios.length) {
                dbServices.populateAudios(Data.Data.Audios);
            }
            if (Data.Data.Stories.length) {
                dbServices.populateStories(Data.Data.Stories);
            }
            if (Data.Data.Images.length) {
                dbServices.populateImages(Data.Data.Images);
            }
            if (Data.Data.Tips.length) {
                dbServices.populateTips(Data.Data.Tips);
            }
            DelRemovedEntities(Data.Data.RemovedEntries);
        }
        else {
            $rootScope.$broadcast('CheckWaitingUpdates');
        }
    });

    $rootScope.$on('CheckWaitingUpdates', function (event) {
        console.log("waitingUpdates: ", $rootScope.waitingUpdates);
        var Authenticated = window.localStorage.getItem("Authenticated") || "false";
        if ($rootScope.waitingUpdates == 0) {
            window.localStorage.setItem("LastUpdateNumber", updateNumber);
            if (Authenticated == "true" || Authenticated == true) {
                var email = window.localStorage.getItem("User_Email");
                AuthServices.GetAutorizedCities(email);
            }
            else
                appPrimaryData.init();
        }
    });

    $rootScope.$on('ServerConnFailed', function (event, error) {
        console.log(error);
        alert("Cannot connect to server. Pleas check your internet connection and try again.");
        var LstUpdtNum = window.localStorage.getItem("LastUpdateNumber") || 0;
        if (LstUpdtNum == 0)
            ApiServices.GetAll(LstUpdtNum);
        else
            appPrimaryData.init();
        //$cordovaDialogs.alert("Couldn’t connect to server, check your internet connection and try again.", 'Network error', 'Try again');
    });


    $rootScope.$on('primaryDataLoaded', function (event) {
        console.log("WaitingPrimaryData: ", $rootScope.WaitingPrimaryData);
        if ($rootScope.WaitingPrimaryData == 0) {
            GoHome();
        }
    });
    $rootScope.$on('primaryDataFailed', function (event) {
        console.error("primaryDataFailed, WaitingPrimaryData: ", $rootScope.WaitingPrimaryData);
        alert("something went wrong, please restart your application.");
        ionic.Platform.exitApp();
    });

    var GoHome = function () {
        dbServices.LoadTopPlayerHistory();
        end = new Date().getTime();
        var time = end - start;
        if (time < SplashTime)
            $timeout(function () {
                $state.go('tabsController.home');
            }, SplashTime - time);
        else {
            $state.go('tabsController.home');
        }
    };
})
.controller('firstPageCtrl', function ($scope, $rootScope, $state, $ionicHistory, $ionicLoading) {
    
})
.controller('secondPageCtrl', function ($scope) {

})
.controller('loginCtrl', function ($scope, AuthServices, $ionicLoading) {
    $scope.logIn = function (user) {
        $ionicLoading.show({
            template: 'Loading...'
        });
        AuthServices.logIn(user.email, user.password, device.uuid);
    }
})
.controller('signupCtrl', function ($scope, $rootScope, AuthServices, $ionicLoading, $ionicPlatform, $state) {
    $scope.Register = function (user) {
        $ionicLoading.show({
            template: 'Loading...'
        });
        $scope.TempUserFullName = user.fullName;
        $scope.TempUserEmail = user.email;
        AuthServices.Register(user.fullName, user.email, user.password, device.uuid)
        .then(function (data) {
            switch (data.data) {
                case 0: { //success
                    window.localStorage.setItem("User_Name", $scope.TempUserFullName);
                    window.localStorage.setItem("User_Email", $scope.TempUserEmail);
                    $rootScope.$broadcast('LoadDefaultUser', {});
                    break;
                }
                case 1: { //userExists
                    $ionicLoading.hide();
                    alert("This email is already regestered. Please log in.");
                    $state.go('login');
                    break;
                }
                case 2: { //fail
                    $ionicLoading.hide();
                    alert("Connecting to server failed.");
                    break;
                }
                case 3: { //uuidMissMatch
                    $ionicLoading.hide();
                    alert("This email registered on another device, try another account or deactivate your email through our website.");
                    break;
                }
                case 4: { //googleUser
                    $ionicLoading.hide();
                    alert("you allready registered with google. Please sign in with Google.");
                    AuthServices.Google(device.uuid);
                    break;
                }
                default:
                    $ionicLoading.hide();
                    if (data == '<HTML></HTML>')
                        console.error("server unknown error");
                    break;
            }
        });
    }
})
.controller('recoverPasswordCtrl', function ($scope, $ionicLoading, AuthServices) {
    $scope.recoverPass = function (email) {
        $ionicLoading.show({
            template: 'Loading...'
        });
        AuthServices.recoverPass(email);
    }
})
.controller('homeCtrl', function ($scope, $rootScope, $state, appPrimaryData) {
    $scope.PageTitle = 'Iran Audio Guide'
    $scope.options = {
        loop: true,
        autoplay: 5000,
        autoplayDisableOnInteraction: false,
        autoplayStopOnLast: false,
        effect: 'fade',
        speed: 1000,
        paginationHide: true
    }
    $scope.Cities = {};
    //$ionicLoading.show({
    //    template: 'Loading...'
    //});
    $scope.Cities = appPrimaryData.getCities();

    $scope.goToSearchPage = function (id) {
        $rootScope.isListenToParams = true;
        $state.go('tabsController.search', { id: id });
    }

    $scope.$on("$ionicView.beforeEnter", function (event, data) {

    });
    //$scope.bookmark = function (placeId) {
    //    dbServices.bookmarkePlace(placeId);
    //};
    //$scope.$on("PlaceBookmarked", function (event, data) {
    //    for (var i = 0; i < $scope.Places.length; i++) {
    //        if ($scope.Places[i].Id == data.placeId) {
    //            $scope.Places[i].bookmarked = 1;
    //            break;
    //        }
    //    }
    //});
    //$scope.$on("PlaceUnbookmarked", function (event, data) {
    //    for (var i = 0; i < $scope.Places.length; i++) {
    //        if ($scope.Places[i].Id == data.placeId) {
    //            $scope.Places[i].bookmarked = 0;
    //            break;
    //        }
    //    }
    //});
})
.controller('favoritsCtrl', function ($scope, dbServices, $ionicListDelegate) {
    $scope.PageTitle = "Bookmarks"
    //$scope.$on("$ionicView.beforeEnter", function (event, data) {
    //    updatePlaces();
    //});
    //var updatePlaces = function () {
    //    dbServices.LoadBookmarkedPlaces();
    //};
    dbServices.LoadBookmarkedPlaces();
    $scope.$on("BookmarkedPlacesLoaded", function (event, data) {
        AllPlaces = [];
        var res = data.result.rows;
        for (var i = 0; i < res.length; i++) {
            AllPlaces.push({
                Id: res.item(i).Pla_Id,
                name: res.item(i).Pla_Name,
                logo: cordova.file.dataDirectory + "/TumbNameil_dir/" + res.item(i).Pla_TNImgUrl,
                address: res.item(i).Pla_address,
                city: res.item(i).Cit_Name,
                CityId: res.item(i).Pla_CityId,
                bookmarked: res.item(i).Pla_bookmarked
            });
        }
        $scope.Places = AllPlaces;
    });
    $scope.defavorito = function (placeId) {
        dbServices.unbookmarkePlace(placeId);
        $ionicListDelegate.closeOptionButtons();
    };
    $scope.$on("PlaceUnbookmarked", function (event, data) {
        for (var i = 0; i < $scope.Places.length; i++) {
            if ($scope.Places[i].Id == data.placeId) {
                $scope.Places.splice(i, 1);
                $scope.$apply();
                break;
            }
        }
    });
    $scope.$on("PlaceBookmarked", function (event, data) {
        dbServices.LoadBookmarkedPlaces();
        $scope.$apply();
    });
})
.controller('packagesCtrl', function ($scope, $rootScope, $stateParams, $state, $ionicLoading, $cordovaInAppBrowser, ApiServices, AuthServices) {
    $scope.PageTitle = 'Purchase package'
    var Authenticated = window.localStorage.getItem("Authenticated") || "false";
    $scope.packages = [];
    console.log($stateParams.id);
    $scope.$on("$ionicView.beforeEnter", function (event, data) {
        $ionicLoading.show({
            template: 'Loading...'
        });
        getPackages();
    });
    $scope.purchasePackage = function (id) {
        var options = {
            location: 'yes',
            clearcache: 'yes',
            toolbar: 'no'
        };
        if (Authenticated == "false") {
            alert("You must register, befor making purchase.");
            $state.go('signup');
        }
        else {
            var User_Email = window.localStorage.getItem("User_Email");
            var uuid = device.uuid;
            var url = 'http://iranaudioguide.com/Payment/Index?email=' + User_Email + '&uuid=' + uuid + '&packageId=' + id;
            console.log("url", url);
            $cordovaInAppBrowser.open(url, '_blank', options)
              .then(function (event) {
                  console.log("open success: ", event);
                  // success
              })
              .catch(function (event) {
                  console.log("open failed: ", event);
                  // error
              });
        }
    };
    $rootScope.$on('$cordovaInAppBrowser:loadstart', function (e, event) {
        console.log("loadstart: ", event);
    });

    $rootScope.$on('$cordovaInAppBrowser:loadstop', function (e, event) {
        console.log("loadstop: ", event);
    });

    $rootScope.$on('$cordovaInAppBrowser:loaderror', function (e, event) {
        console.log("loaderror: ", event);
    });

    $rootScope.$on('$cordovaInAppBrowser:exit', function (e, event) {
        $ionicLoading.show({
            template: 'Loading...'
        });
        console.log("exit: ", event);
        $rootScope.inAppRefresh = "true";
        AuthServices.GetAutorizedCities($rootScope.User_Email);
    });
    var getPackages = function () {
        ApiServices.GetPackages($stateParams.id).
        then(function (response) {
            if (response.data.errorMessage.length > 0) {
                console.error("GetPackages-->", response.data.errorMessage);
                $ionicLoading.hide();
                alert("We cant connect to server. Please try again later.");
            }
            else {
                console.log("GetPackages", response);
                $scope.packages = response.data.packages;
                $ionicLoading.hide();
            }
        }, function (response) {
            console.error("GetPackages-->", response);
            $ionicLoading.hide();
            alert("We cant connect to server. Please try again later.");
        });
    };
})
.controller('searchCtrl', function ($scope, $rootScope, $state, $ionicPlatform, $ionicLoading, $ionicListDelegate, $stateParams, appPrimaryData, dbServices) {

    var SelectedCity = 0;
    var isInitialized = false;
    $scope.$on("$ionicView.beforeEnter", function (event, data) {
        if (!isInitialized || $rootScope.isListenToParams) {
            $scope.SelectedCity = $stateParams.id;
            CitySelected($stateParams.id);
            isInitialized = true;
        }
        $rootScope.isListenToParams = false;
    });
    //$scope.$on("$ionicView.afterEnter", function (event, data) {
    //    if (!$scope.isIitialized || $rootScope.isListenToParams) {
    //        $scope.SelectedCity = $stateParams.id;
    //        CitySelected($stateParams.id);
    //        $scope.isIitialized = true;
    //    }
    //    $rootScope.isListenToParams = false;
    //});
    $scope.PageTitle = "Places"
    var cities = [{ Id: "0", Name: "All Places" }];
    var AllPlaces = [];
    $scope.Cities = [];
    $scope.selectedPlaces = [];

    $scope.Cities = cities.concat(appPrimaryData.getCities());
    AllPlaces = appPrimaryData.getPlaces();

    $scope.Clear = function () {
        $scope.search = '';
    }
    var CitySelected = function (id) {
        SelectedCity = id;
        var tempList = [];
        for (var i = 0; i < AllPlaces.length; i++)
            if (id == 0 || AllPlaces[i].CityId == id)
                tempList.push(AllPlaces[i]);
        $scope.selectedPlaces = tempList;
    }
    $scope.CitySelected = function (id) {
        CitySelected(id);
    };
    var searchPlace = function (word) {
        var tempList = [];
        $scope.selectedPlaces = [];
        if (word !== '') {
            var re = new RegExp(word, 'i');
            for (var i = 0; i < AllPlaces.length; i++) {
                if (re.test(AllPlaces[i].name) &&
                    (SelectedCity == 0 || AllPlaces[i].CityId == SelectedCity))
                    tempList.push(AllPlaces[i]);
            }
        }
        else {
            for (var j = 0; j < AllPlaces.length; j++)
                if (SelectedCity == 0 || AllPlaces[j].CityId == SelectedCity)
                    tempList.push(AllPlaces[j]);
        }

        $scope.selectedPlaces = angular.copy(tempList);
    }
    $scope.searchPlaces = function (word) {
        searchPlace(word);
    };

    $scope.$on('primaryDataLoaded_inApp', function (event) {
        console.log("WaitingPrimaryData: ", $rootScope.WaitingPrimaryData);
        if ($rootScope.WaitingPrimaryData == 0) {
            $rootScope.inAppRefresh = "false";
            $scope.Cities = cities.concat(appPrimaryData.getCities());
            AllPlaces = appPrimaryData.getPlaces();
            $scope.SelectedCity = 0;
            $scope.search = "";
            $scope.CitySelected(0);
            $ionicLoading.hide();
            $state.go('tabsController.search', { id: SelectedCity });
        }
    });
})
.controller('playerCtrl', function ($rootScope, $ionicHistory) {
    console.log("soroosh");

})
.controller('placeCtrl', function ($scope, $ionicPlatform, dbServices, FileServices, player, $timeout, $rootScope, $ionicLoading, $stateParams, $ionicListDelegate) {
    //// run this function when either hard or soft back button is pressed
    //var doCustomBack = function () {
    //    console.log("custom BACK");
    //    $state.go('tabsController.search', { id: id });
    //};

    //// override soft back
    //// framework calls $rootScope.$ionicGoBack when soft back button is pressed
    //var oldSoftBack = $rootScope.$ionicGoBack;
    //$rootScope.$ionicGoBack = function () {
    //    doCustomBack();
    //};
    //var deregisterSoftBack = function () {
    //    $rootScope.$ionicGoBack = oldSoftBack;
    //};

    //// override hard back
    //// registerBackButtonAction() returns a function which can be used to deregister it
    //var deregisterHardBack = $ionicPlatform.registerBackButtonAction(
    //    doCustomBack, 101
    //);

    //// cancel custom back behaviour
    //$scope.$on('$destroy', function () {
    //    deregisterHardBack();
    //    deregisterSoftBack();
    //});
    var defaultImageSource = 'img/default-thumbnail.jpg';
    $scope.options = {
        loop: true
    }
    $scope.placeBookmarked = 0;
    $scope.PlaceInfo = {
        Audios: [],
        Stories: [],
        ExtraImages: [],
        Tips: []
    };
    var placeId = $stateParams.id;
    $scope.options = {
        loop: false
    }

    $scope.percentClass = function (percent) {
        return 'p' + percent.toString();
    };

    //player stuff
    var searchById = function (arr, id) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].Id == id)
                return i;
        }
    };
    var checkPlayer = function () {
        var info = player.info();
        if (info.hasMedia) {
            if (info.PlaceId == placeId) {
                if (info.isAudio) {
                    var idx = searchById($scope.PlaceInfo.Audios, info.trackInfo.Id);
                    $scope.PlaceInfo.Audios[idx].playing = info.playing;
                }
                else {
                    var idx = searchById($scope.PlaceInfo.Stories, info.trackInfo.Id);
                    $scope.PlaceInfo.Stories[idx].playing = info.playing;
                }
            }
        }
    };
    $scope.$on('playerUpdated', function () {
        var info = player.info();
        if (info.isAudio) {
            for (var i = 0; i < $scope.PlaceInfo.Audios.length; i++) {
                if ($scope.PlaceInfo.Audios[i].Id == info.trackInfo.Id)
                    $scope.PlaceInfo.Audios[i].playing = info.playing;
                else
                    $scope.PlaceInfo.Audios[i].playing = false;
            }
            for (var i = 0; i < $scope.PlaceInfo.Stories.length; i++)
                $scope.PlaceInfo.Stories[i].playing = false;
        }
        else {
            for (var i = 0; i < $scope.PlaceInfo.Stories.length; i++) {
                if ($scope.PlaceInfo.Stories[i].Id == info.trackInfo.Id)
                    $scope.PlaceInfo.Stories[i].playing = info.playing;
                else
                    $scope.PlaceInfo.Stories[i].playing = false;
            }
            for (var i = 0; i < $scope.PlaceInfo.Audios.length; i++)
                $scope.PlaceInfo.Audios[i].playing = false;
        }
    });
    var playPause = function (idx, isAudio) {
        var info = player.info();
        var track;
        track = (isAudio) ? $scope.PlaceInfo.Audios[idx] : $scope.PlaceInfo.Stories[idx];
        if (info.hasMedia &&
            track.Id == info.trackInfo.Id) {
            if (track.playing)
                player.pause();
            else
                player.play();
        }
        else {
            player.New(track, isAudio, idx, placeId);
            player.play();
        }
    }
    //var iOSPlayOptions = {
    //    numberOfLoops: 1,
    //    playAudioWhenScreenIsLocked: true
    //}

    $scope.ModifyText = function (str) {
        str = str || "";
        return str.replace("\r\n", "<br />");
    }
    $scope.ChooseClass = function (isDownloaded, isPlaying) {
        if (!isDownloaded)
            return 'ion-android-download';
        if (isPlaying)
            return 'ion-pause';
        return 'ion-play';
    };
    //$scope.slideHasChanged = function (index) {
    //    var itemIdx = index % $scope.PlaceInfo.ExtraImages.length;
    //    $scope.ExtraImageMarkDown = $scope.PlaceInfo.ExtraImages[itemIdx].description;
    //}


    var PlaceWaitingUpdates;
    var checkPlaceWaitingUpdates = function () {
        PlaceWaitingUpdates--;
        if (PlaceWaitingUpdates == 0) {
            $ionicLoading.hide();
        }
    }
    $scope.PageInitialize = false;
    var initializePlacePage = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        PlaceWaitingUpdates = 5;
        $scope.PlaceInfo.PlaceId = placeId;
        dbServices.LoadPlaceInfos(placeId);
        dbServices.LoadPlaceAudios(placeId);
        dbServices.LoadPlaceStories(placeId);
        dbServices.LoadPlaceImages(placeId);
        dbServices.LoadPlaceTips(placeId);
        $scope.PageInitialize = true;
    }
    $scope.$on("$ionicView.beforeEnter", function (event, data) {
    });
    $scope.$on("$ionicView.afterEnter", function (event, data) {
        if (!$scope.PageInitialize) {
            initializePlacePage();
        }
        checkPlayer();
        $scope.ShowBookmark = true;
    });
    $scope.$on("$ionicView.leave", function (event, data) {
        //freePlayer();
    });


    //loading place basic infos
    $scope.$on('PlaceInfoesLoaded', function (event, data) {
        var res = data.result.rows.item(0);
        //$scope.pageTitle = res.Pla_Name;
        //$timeout(function () {
        //    $scope.pageTitle = res.Pla_Name;
        //}, 500);
        if (res.Pla_Dirty_imgUrl) {
            PlaceWaitingUpdates++;
            $scope.PlaceInfo.PlaceImage = defaultImageSource;
            FileServices.DownloadPlaceImage(res.Pla_imgUrl, placeId)
                .then(function (result) {// Success!
                    dbServices.CleanPlaceImage(placeId);
                    $scope.PlaceInfo.PlaceImage = cordova.file.dataDirectory + "/PlacePic_dir/" + res.Pla_imgUrl;
                    checkPlaceWaitingUpdates();
                }, function (err) {// Error
                    checkPlaceWaitingUpdates();
                    console.error(err);
                }, function (progress) {
                    //$timeout(function () {
                    //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                    //});
                });
        }
        else
            $scope.PlaceInfo.PlaceImage = cordova.file.dataDirectory + "/PlacePic_dir/" + res.Pla_imgUrl;

        $scope.PlaceInfo.PlaceName = res.Pla_Name;
        $scope.PlaceInfo.PlaceDescription = res.Pla_desc;
        $scope.PlaceInfo.PlaceCordinateX = res.Pla_c_x;
        $scope.PlaceInfo.PlaceCordinateY = res.Pla_c_y;
        $scope.PlaceInfo.Placeaddress = res.Pla_address;
        $scope.PlaceInfo.PlaceCityId = res.Pla_CityId;
        $scope.placeBookmarked = res.Pla_bookmarked;
        checkPlaceWaitingUpdates();
    });

    //loading place audios
    $scope.$on('PlaceAudiosLoaded', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            $scope.PlaceInfo.Audios.push({
                Id: res.item(i).Aud_Id,
                Name: res.item(i).Aud_Name,
                url: res.item(i).Aud_Url,
                description: res.item(i).Aud_desc,
                downloaded: !res.item(i).Aud_Dirty,
                downloadProgress: 0,
                downloading: false,
                playing: false
            });
        }
        checkPlaceWaitingUpdates();
    });

    //loading place Stories
    $scope.$on('PlaceStoriesLoaded', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            $scope.PlaceInfo.Stories.push({
                Id: res.item(i).Sto_Id,
                Name: res.item(i).Sto_Name,
                url: res.item(i).Sto_Url,
                description: res.item(i).Sto_desc,
                downloaded: !res.item(i).Sto_Dirty,
                downloadProgress: 0,
                downloading: false,
                playing: false
            });
        }
        checkPlaceWaitingUpdates();
    });

    //loading place extra images
    $scope.$on('PlaceImagesLoaded', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            if (res.item(i).Img_Dirty) {
                PlaceWaitingUpdates++;
                FileServices.DownloadExtraImage(res.item(i).Img_Url, res.item(i).Img_Id, res.item(i).Img_desc);
            }
            else {
                $scope.PlaceInfo.ExtraImages.push({
                    Id: res.item(i).Img_Id,
                    description: res.item(i).Img_desc,
                    path: cordova.file.dataDirectory + "/Extras_dir/" + res.item(i).Img_Url
                });
            }

            if ($scope.PlaceInfo.ExtraImages.length == 1)
                $scope.ExtraImageMarkDown = $scope.PlaceInfo.ExtraImages[0].description;
        }
        checkPlaceWaitingUpdates();
    });
    $scope.$on('PlaceExtraImageDownloaded', function (event, Data) {
        dbServices.CleanPlaceExtraImage(Data.Img_Id);
        $scope.PlaceInfo.ExtraImages.push({
            Id: Data.Img_Id,
            description: Data.Img_desc,
            path: Data.Img_Url
        });
        if ($scope.PlaceInfo.ExtraImages.length == 1)
            $scope.ExtraImageMarkDown = $scope.PlaceInfo.ExtraImages[0].description;
        checkPlaceWaitingUpdates();
    });

    $scope.$on('PlaceExtraImageDownloadFailed', function (event) {
        checkPlaceWaitingUpdates();
    });

    //loading place Tips
    $scope.$on('PlaceTipsLoaded', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            $scope.PlaceInfo.Tips.push({
                Id: res.item(i).Tip_Id,
                Class: res.item(i).TiC_Class,
                Content: res.item(i).Tip_Contetnt
            });
        }
        checkPlaceWaitingUpdates();
    });



    //Audio stuffs
    $scope.audioClicked = function (idx) {
        var audio = $scope.PlaceInfo.Audios[idx];
        if (!audio.downloaded) {
            downloadAudio(idx);
        }
        else {
            playPause(idx, true);//isAudio = True
        }
    }
    var downloadAudio = function (idx) {
        $scope.PlaceInfo.Audios[idx].downloading = true;
        var audio = $scope.PlaceInfo.Audios[idx];
        FileServices.DownloadAudio(audio.url)
            .then(function (result) {// Success!
                dbServices.CleanAudio(audio.Id);
                $scope.PlaceInfo.Audios[idx].downloading = false;
                $scope.PlaceInfo.Audios[idx].downloaded = true;
            }, function (err) {// Error
                $scope.PlaceInfo.Audios[idx].downloading = false;
                $scope.PlaceInfo.Audios[idx].downloaded = false;
            }, function (progress) {
                $timeout(function () {
                    $scope.PlaceInfo.Audios[idx].downloadProgress =
                        Math.floor((progress.loaded / progress.total) * 100);
                }, 5000);
            });
    }

    //Story stuffs
    $scope.StoryClicked = function (idx) {
        var story = $scope.PlaceInfo.Stories[idx];
        if (!story.downloaded) {
            downloadStory(idx);
        }
        else {
            playPause(idx, false);//isAudio = false
        }
    }
    var downloadStory = function (idx) {
        $scope.PlaceInfo.Stories[idx].downloading = true;
        var story = $scope.PlaceInfo.Stories[idx];
        FileServices.DownloadStory(story.url)
            .then(function (result) {// Success!
                dbServices.CleanStory(story.Id);
                $scope.PlaceInfo.Stories[idx].downloading = false;
                $scope.PlaceInfo.Stories[idx].downloaded = true;
            }, function (err) {// Error
                console.log(err);
                $scope.PlaceInfo.Stories[idx].downloading = false;
                $scope.PlaceInfo.Stories[idx].downloaded = false;
            }, function (progress) {
                $timeout(function () {
                    $scope.PlaceInfo.Stories[idx].downloadProgress =
                        Math.floor((progress.loaded / progress.total) * 100);
                }, 5000);
            });
    }


    //remove track
    $scope.removeTrack = function (id, idx, isAudio) {
        $ionicListDelegate.closeOptionButtons();
        FileServices.RemovePlaceTrack($scope.PlaceInfo.Audios[idx].url, isAudio, idx, id);
    }
    $scope.$on("fileRemoved", function (event, data) {
        if (data.isAudio) {
            if ($scope.PlaceInfo.Audios[data.idx].Id == data.id) {
                dbServices.DirtyAudio(data.id);
                $scope.PlaceInfo.Audios[data.idx].downloaded = false;
            }
        }
        else {
            if ($scope.PlaceInfo.Stories[data.idx].Id == data.id) {
                dbServices.DirtyStory(data.id);
                $scope.PlaceInfo.Stories[data.idx].downloaded = false;
            }
        }
    });

    $scope.bookmark = function (placeId) {
        if ($scope.placeBookmarked == 0) {
            dbServices.bookmarkePlace(placeId);
        }
        else {
            dbServices.unbookmarkePlace(placeId);
        }
    };
    $scope.$on("PlaceBookmarked", function (event, data) {
        $scope.placeBookmarked = 1;
    });
    $scope.$on("PlaceUnbookmarked", function (event, data) {
        $scope.placeBookmarked = 0;
    });
})
.controller('placeBookMarkCtrl', function ($scope, $ionicPlatform, dbServices, FileServices, player, $timeout, $rootScope, $ionicLoading, $stateParams, $ionicListDelegate) {
    var defaultImageSource = 'img/default-thumbnail.jpg';
    $scope.options = {
        loop: true
    }
    $scope.placeBookmarked = 0;
    $scope.PlaceInfo = {
        Audios: [],
        Stories: [],
        ExtraImages: [],
        Tips: []
    };
    var placeId = $stateParams.id;
    $scope.options = {
        loop: false
    }

    $scope.percentClass = function (percent) {
        return 'p' + percent.toString();
    };

    //player stuff
    var searchById = function (arr, id) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].Id == id)
                return i;
        }
    };
    var checkPlayer = function () {
        var info = player.info();
        if (info.hasMedia) {
            if (info.PlaceId == placeId) {
                if (info.isAudio) {
                    var idx = searchById($scope.PlaceInfo.Audios, info.trackInfo.Id);
                    $scope.PlaceInfo.Audios[idx].playing = info.playing;
                }
                else {
                    var idx = searchById($scope.PlaceInfo.Stories, info.trackInfo.Id);
                    $scope.PlaceInfo.Stories[idx].playing = info.playing;
                }
            }
        }
    };
    $scope.$on('playerUpdated', function () {
        var info = player.info();
        if (info.isAudio) {
            for (var i = 0; i < $scope.PlaceInfo.Audios.length; i++) {
                if ($scope.PlaceInfo.Audios[i].Id == info.trackInfo.Id)
                    $scope.PlaceInfo.Audios[i].playing = info.playing;
                else
                    $scope.PlaceInfo.Audios[i].playing = false;
            }
            for (var i = 0; i < $scope.PlaceInfo.Stories.length; i++)
                $scope.PlaceInfo.Stories[i].playing = false;
        }
        else {
            for (var i = 0; i < $scope.PlaceInfo.Stories.length; i++) {
                if ($scope.PlaceInfo.Stories[i].Id == info.trackInfo.Id)
                    $scope.PlaceInfo.Stories[i].playing = info.playing;
                else
                    $scope.PlaceInfo.Stories[i].playing = false;
            }
            for (var i = 0; i < $scope.PlaceInfo.Audios.length; i++)
                $scope.PlaceInfo.Audios[i].playing = false;
        }
    });
    var playPause = function (idx, isAudio) {
        var info = player.info();
        var track;
        track = (isAudio) ? $scope.PlaceInfo.Audios[idx] : $scope.PlaceInfo.Stories[idx];
        if (info.hasMedia &&
            track.Id == info.trackInfo.Id) {
            if (track.playing)
                player.pause();
            else
                player.play();
        }
        else {
            player.New(track, isAudio, idx, placeId);
            player.play();
        }
    }
    //var iOSPlayOptions = {
    //    numberOfLoops: 1,
    //    playAudioWhenScreenIsLocked: true
    //}

    $scope.ModifyText = function (str) {
        str = str || "";
        return str.replace("\r\n", "<br />");
    }
    $scope.ChooseClass = function (isDownloaded, isPlaying) {
        if (!isDownloaded)
            return 'ion-android-download';
        if (isPlaying)
            return 'ion-pause';
        return 'ion-play';
    };
    //$scope.slideHasChanged = function (index) {
    //    var itemIdx = index % $scope.PlaceInfo.ExtraImages.length;
    //    $scope.ExtraImageMarkDown = $scope.PlaceInfo.ExtraImages[itemIdx].description;
    //}


    var PlaceWaitingUpdates;
    var checkPlaceWaitingUpdates = function () {
        PlaceWaitingUpdates--;
        if (PlaceWaitingUpdates == 0) {
            //$ionicSlideBoxDelegate.update();
            $ionicLoading.hide();
        }
    }
    $scope.PageInitialize = false;
    var initializePlacePage = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        PlaceWaitingUpdates = 5;
        $scope.PlaceInfo.PlaceId = placeId;
        dbServices.LoadPlaceInfos(placeId, 1);
        dbServices.LoadPlaceAudios(placeId, 1);
        dbServices.LoadPlaceStories(placeId, 1);
        dbServices.LoadPlaceImages(placeId, 1);
        dbServices.LoadPlaceTips(placeId, 1);
        $scope.PageInitialize = true;
    }
    $scope.$on("$ionicView.beforeEnter", function (event, data) {
    });
    $scope.$on("$ionicView.afterEnter", function (event, data) {
        if (!$scope.PageInitialize) {
            initializePlacePage();
        }
        checkPlayer();
    });
    $scope.$on("$ionicView.leave", function (event, data) {
        //freePlayer();
    });


    //loading place basic infos
    $scope.$on('PlaceInfoesLoaded_bookmark', function (event, data) {
        var res = data.result.rows.item(0);
        //$scope.pageTitle = res.Pla_Name;
        //$timeout(function () {
        //    $scope.pageTitle = res.Pla_Name;
        //}, 500);
        if (res.Pla_Dirty_imgUrl) {
            PlaceWaitingUpdates++;
            $scope.PlaceInfo.PlaceImage = defaultImageSource;
            FileServices.DownloadPlaceImage(res.Pla_imgUrl, placeId)
                .then(function (result) {// Success!
                    dbServices.CleanPlaceImage(placeId);
                    $scope.PlaceInfo.PlaceImage = cordova.file.dataDirectory + "/PlacePic_dir/" + res.Pla_imgUrl;
                    checkPlaceWaitingUpdates();
                }, function (err) {// Error
                    checkPlaceWaitingUpdates();
                    console.error(err);
                }, function (progress) {
                    //$timeout(function () {
                    //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                    //});
                });
        }
        else
            $scope.PlaceInfo.PlaceImage = cordova.file.dataDirectory + "/PlacePic_dir/" + res.Pla_imgUrl;

        $scope.PlaceInfo.PlaceName = res.Pla_Name;
        $scope.PlaceInfo.PlaceDescription = res.Pla_desc;
        $scope.PlaceInfo.PlaceCordinateX = res.Pla_c_x;
        $scope.PlaceInfo.PlaceCordinateY = res.Pla_c_y;
        $scope.PlaceInfo.Placeaddress = res.Pla_address;
        $scope.PlaceInfo.PlaceCityId = res.Pla_CityId;
        $scope.placeBookmarked = res.Pla_bookmarked;
        checkPlaceWaitingUpdates();
    });

    //loading place audios
    $scope.$on('PlaceAudiosLoaded_bookmark', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            $scope.PlaceInfo.Audios.push({
                Id: res.item(i).Aud_Id,
                Name: res.item(i).Aud_Name,
                url: res.item(i).Aud_Url,
                description: res.item(i).Aud_desc,
                downloaded: !res.item(i).Aud_Dirty,
                downloadProgress: 0,
                downloading: false,
                playing: false
            });
        }
        checkPlaceWaitingUpdates();
    });

    //loading place Stories
    $scope.$on('PlaceStoriesLoaded_bookmark', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            $scope.PlaceInfo.Stories.push({
                Id: res.item(i).Sto_Id,
                Name: res.item(i).Sto_Name,
                url: res.item(i).Sto_Url,
                description: res.item(i).Sto_desc,
                downloaded: !res.item(i).Sto_Dirty,
                downloadProgress: 0,
                downloading: false,
                playing: false
            });
        }
        checkPlaceWaitingUpdates();
    });

    //loading place extra images
    $scope.$on('PlaceImagesLoaded_bookmark', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            if (res.item(i).Img_Dirty) {
                PlaceWaitingUpdates++;
                FileServices.DownloadExtraImage(res.item(i).Img_Url, res.item(i).Img_Id, res.item(i).Img_desc);
            }
            else {
                $scope.PlaceInfo.ExtraImages.push({
                    Id: res.item(i).Img_Id,
                    description: res.item(i).Img_desc,
                    path: cordova.file.dataDirectory + "/Extras_dir/" + res.item(i).Img_Url
                });
            }

            if ($scope.PlaceInfo.ExtraImages.length == 1)
                $scope.ExtraImageMarkDown = $scope.PlaceInfo.ExtraImages[0].description;
        }
        checkPlaceWaitingUpdates();
    });
    $scope.$on('PlaceExtraImageDownloaded_bookmark', function (event, Data) {
        dbServices.CleanPlaceExtraImage(Data.Img_Id);
        $scope.PlaceInfo.ExtraImages.push({
            Id: Data.Img_Id,
            description: Data.Img_desc,
            path: Data.Img_Url
        });
        if ($scope.PlaceInfo.ExtraImages.length == 1)
            $scope.ExtraImageMarkDown = $scope.PlaceInfo.ExtraImages[0].description;
        checkPlaceWaitingUpdates();
    });

    $scope.$on('PlaceExtraImageDownloadFailed_bookmark', function (event) {
        checkPlaceWaitingUpdates();
    });

    //loading place Tips
    $scope.$on('PlaceTipsLoaded_bookmark', function (event, Data) {
        var res = Data.result.rows;
        for (var i = 0; i < res.length; i++) {
            $scope.PlaceInfo.Tips.push({
                Id: res.item(i).Tip_Id,
                Class: res.item(i).TiC_Class,
                Content: res.item(i).Tip_Contetnt
            });
        }
        checkPlaceWaitingUpdates();
    });



    //Audio stuffs
    $scope.audioClicked = function (idx) {
        var audio = $scope.PlaceInfo.Audios[idx];
        if (!audio.downloaded) {
            downloadAudio(idx);
        }
        else {
            playPause(idx, true);//isAudio = True
        }
    }
    var downloadAudio = function (idx) {
        $scope.PlaceInfo.Audios[idx].downloading = true;
        var audio = $scope.PlaceInfo.Audios[idx];
        FileServices.DownloadAudio(audio.url)
            .then(function (result) {// Success!
                dbServices.CleanAudio(audio.Id);
                $scope.PlaceInfo.Audios[idx].downloading = false;
                $scope.PlaceInfo.Audios[idx].downloaded = true;
            }, function (err) {// Error
                $scope.PlaceInfo.Audios[idx].downloading = false;
                $scope.PlaceInfo.Audios[idx].downloaded = false;
            }, function (progress) {
                $timeout(function () {
                    $scope.PlaceInfo.Audios[idx].downloadProgress =
                        Math.floor((progress.loaded / progress.total) * 100);
                }, 5000);
            });
    }

    //Story stuffs
    $scope.StoryClicked = function (idx) {
        var story = $scope.PlaceInfo.Stories[idx];
        if (!story.downloaded) {
            downloadStory(idx);
        }
        else {
            playPause(idx, false);//isAudio = false
        }
    }
    var downloadStory = function (idx) {
        $scope.PlaceInfo.Stories[idx].downloading = true;
        var story = $scope.PlaceInfo.Stories[idx];
        FileServices.DownloadStory(story.url)
            .then(function (result) {// Success!
                dbServices.CleanStory(story.Id);
                $scope.PlaceInfo.Stories[idx].downloading = false;
                $scope.PlaceInfo.Stories[idx].downloaded = true;
            }, function (err) {// Error
                console.log(err);
                $scope.PlaceInfo.Stories[idx].downloading = false;
                $scope.PlaceInfo.Stories[idx].downloaded = false;
            }, function (progress) {
                $timeout(function () {
                    $scope.PlaceInfo.Stories[idx].downloadProgress =
                        Math.floor((progress.loaded / progress.total) * 100);
                }, 5000);
            });
    }


    //remove track
    $scope.removeTrack = function (id, idx, isAudio) {
        $ionicListDelegate.closeOptionButtons();
        FileServices.RemovePlaceTrack($scope.PlaceInfo.Audios[idx].url, isAudio, idx, id);
    }
    $scope.$on("fileRemoved", function (event, data) {
        if (data.isAudio) {
            if ($scope.PlaceInfo.Audios[data.idx].Id == data.id) {
                dbServices.DirtyAudio(data.id);
                $scope.PlaceInfo.Audios[data.idx].downloaded = false;
            }
        }
        else {
            if ($scope.PlaceInfo.Stories[data.idx].Id == data.id) {
                dbServices.DirtyStory(data.id);
                $scope.PlaceInfo.Stories[data.idx].downloaded = false;
            }
        }
    });

    $scope.bookmark = function (placeId) {
        if ($scope.placeBookmarked == 0) {
            dbServices.bookmarkePlace(placeId);
        }
        else {
            dbServices.unbookmarkePlace(placeId);
        }
    };
    $scope.$on("PlaceBookmarked", function (event, data) {
        $scope.placeBookmarked = 1;
    });
    $scope.$on("PlaceUnbookmarked", function (event, data) {
        $scope.placeBookmarked = 0;
    });
})
.controller('toturialsCtrl', function ($rootScope, $ionicHistory) {

});