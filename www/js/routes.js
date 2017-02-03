angular.module('app.routes', [])

.config(function ($stateProvider, $urlRouterProvider) {

    // Each state's controller can be found in controllers.js
    $stateProvider
    .state('primaryPage', {
        url: '/primary',
        templateUrl: 'templates/primaryPage.html',
        controller: 'primaryPageCtrl'
    })
    .state('firstPage', {
        url: '/first',
        templateUrl: 'templates/firstPage.html',
        controller: 'firstPageCtrl'
    })

    .state('secondPage', {
        url: '/second ',
        templateUrl: 'templates/secondPage.html',
        controller: 'secondPageCtrl'
    })
    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
    })

    .state('toturials', {
        url: '/toturials',
        templateUrl: 'templates/toturials.html',
        controller: 'toturialsCtrl'
    })
    .state('signup', {
        url: '/signup',
        templateUrl: 'templates/signup.html',
        controller: 'signupCtrl'
    })
    .state('recoverPassword', {
        url: '/recoverPass',
        templateUrl: 'templates/recoverPassword.html',
        controller: 'recoverPasswordCtrl'
    })
    .state('tabsController', {
        url: '/page1',
        templateUrl: 'templates/tabsController.html',
        abstract: true
    })

    .state('tabsController.home', {
        url: '/page2',
        views: {
            'tab1': {
                templateUrl: 'templates/home.html',
                controller: 'homeCtrl'
            }
        }
    })

    .state('tabsController.favorits', {
        url: '/page3',
        views: {
            'tab2': {
                templateUrl: 'templates/favorits.html',
                controller: 'favoritsCtrl'
            }
        }
    })

    .state('tabsController.search', {
        url: '/page4',
        params: {
            id: '0'
        },
        views: {
            'tab3': {
                templateUrl: 'templates/search.html',
                controller: 'searchCtrl'
            }
        }
    })
    .state('tabsController.packages', {
        url: '/packages',
        params: {
            id: '0'
        },
        views: {
            'tab3': {
                templateUrl: 'templates/packages.html',
                controller: 'packagesCtrl'
            }
        }
    })

    .state('tabsController.place', {
        url: '/page5',
        params: {
            id: '0'
        },
        views: {
            'tab1': {
                templateUrl: 'templates/place.html',
                controller: 'placeCtrl'
            }
        }
    })
    .state('tabsController.placeBookmarked', {
        url: '/placeBookmarked',
        params: {
            id: '0'
        },
        views: {
            'tab2': {
                templateUrl: 'templates/place.html',
                controller: 'placeBookMarkCtrl'
            }
        }
    })
    .state('tabsController.placeSearched', {
        url: '/placeSearched',
        params: {
            id: '0'
        },
        views: {
            'tab3': {
                templateUrl: 'templates/place.html',
                controller: 'placeCtrl'
            }
        }
    })

    $urlRouterProvider.otherwise('/primary')
});