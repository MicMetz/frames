require( [
		"esri/views/MapView",
		"esri/WebMap",
		"esri/Map",
		"esri/layers/FeatureLayer",
		"esri/widgets/Legend",
		"esri/widgets/Expand",
		"esri/widgets/Compass",
		"esri/widgets/ScaleBar"
], function (
		MapView,
		WebMap,
		Map,
		FeatureLayer,
		Legend,
		Expand,
		Compass,
		ScaleBar
) {

		let yearChart,
						typeChart,
						accessibilityChart,

						totalNumber,
						amountCam,
						avgOpenTime;


		const webmap = new WebMap( {
				portalItem: {
						id: "35387a72056746c29ccefe98b251a2df"
				}
		} );

		var overviewMap = new Map( {
				basemap: "streets-vector"
		} );

		const featureLayer = new FeatureLayer( {
				portalItem: {
						id: "35387a72056746c29ccefe98b251a2df"
				}
		} );
		webmap.add( featureLayer );

		const view = new MapView( {
				map        : webmap,
				container  : "viewDiv",
				center     : [ -98, 38 ],
				zoom       : 1,
				constraints: {
						minScale: 53000000
				}
		} );

		var compass = new Compass( {
				view: view
		} );

		var scaleBar = new ScaleBar( {
				view: view,
				unit: "dual" // The scale bar displays both metric and non-metric units.
		} );

		var mapView           = new MapView( {
				container  : "overviewDiv",
				center     : [ -98, 38.0 ],
				zoom       : 1,
				map        : overviewMap,
				constraints: {
						rotationEnabled: false
				}
		} );
		mapView.ui.components = [];
		view.ui.add( "overviewDiv", "bottom-right" );


		function setup() {
				const extent3Dgraphic = new Graphic( {
						geometry: null,
						symbol  : {
								type   : "simple-fill",
								color  : [ 0, 0, 0, 0.5 ],
								outline: null
						}
				} );
				mapView.graphics.add( extent3Dgraphic );

				watchUtils.init( mainView, "extent", function ( extent ) {
						// Sync the overview map location
						// whenever the 3d view is stationary
						if ( mainView.stationary ) {
								mapView
								.goTo( {
										center: mainView.center,
										scale :
												mainView.scale *
												2 *
												Math.max(
														mainView.width / mapView.width,
														mainView.height / mapView.height
												)
								} )
								.catch( function ( error ) {
										// ignore goto-interrupted errors
										if ( error.name != "view:goto-interrupted" ) {
												console.error( error );
										}
								} );
						}
				} );
		};

		// Add UI elements to the view

		// Displays instructions to the user for understanding the sample
		// And places them in an Expand widget instance

		const titleContent                 = document.createElement( "div" );
		titleContent.style.padding         = "15px";
		titleContent.style.backgroundColor = "white";
		titleContent.style.width           = "500px";
		titleContent.innerHTML             = [
				"<div id='title' class='esri-widget'>",
				"<span id='num-cameras'>3057</span> recording devices were found on <span id='amg-type'>12/05/2020</span>. The average time a device has been",
				"discoverable is <span id='avg-open-time'>100</span> hours.",
				"</div>"
		].join( " " );

		const titleExpand = new Expand( {
				expandIconClass: "esri-icon-dashboard",
				expandTooltip  : "Summary stats",
				view           : view,
				content        : titleContent,
				expanded       : view.widthBreakpoint !== "xsmall"
		} );
		view.ui.add( titleExpand, "top-right" );

		const legendExpand = new Expand( {
				view    : view,
				content : new Legend( {
						view: view
				} ),
				expanded: view.widthBreakpoint !== "xsmall"
		} );
		view.ui.add( legendExpand, "bottom-left" );
		view.ui.add( scaleBar, { position: "top-left" } );
		view.ui.add( compass, { position: "top-left" } );

		view.watch( "widthBreakpoint", function ( newValue ) {
				titleExpand.expanded  = newValue !== "xsmall";
				legendExpand.expanded = newValue !== "xsmall";
		} );

		/*DISABLED NAV AND EXTENT FOR A FIXED PRESENTATION*/
		view.when( maintainFixedExtent ).then( disableNavigation );
		mapView.when( disableNavigation ).then( disablePopupOnClick );


		function maintainFixedExtent( view ) {
				var fixedExtent = view.extent.clone();
				// keep a fixed extent in the view
				// when the view size changes
				view.on( "resize", function () {
						view.extent = fixedExtent;
				} );
				return view;
		}


		// disables all navigation in the view
		function disableNavigation( view ) {
				view.popup.dockEnabled = true;

				// Removes the zoom action on the popup
				view.popup.actions = [];


				// stops propagation of default behavior when an event fires
				function stopEvtPropagation( event ) {
						event.stopPropagation();
				}


				// disable mouse wheel scroll zooming on the view
				view.navigation.mouseWheelZoomEnabled = false;

				// disable zooming via double-click on the view
				view.on( "double-click", stopEvtPropagation );

				// disable zooming out via double-click + Control on the view
				view.on( "double-click", [ "Control" ], stopEvtPropagation );

				// disables pinch-zoom and panning on the view
				view.navigation.browserTouchPanEnabled = false;
				view.on( "drag", stopEvtPropagation );

				// disable the view's zoom box to prevent the Shift + drag
				// and Shift + Control + drag zoom gestures.
				view.on( "drag", [ "Shift" ], stopEvtPropagation );
				view.on( "drag", [ "Shift", "Control" ], stopEvtPropagation );

				// prevents zooming and rotation with the indicated keys
				view.on( "key-down", function ( event ) {
						var prohibitedKeys = [ "+", "-", "_", "=", "a", "d" ];
						var keyPressed     = event.key.toLowerCase();
						if ( prohibitedKeys.indexOf( keyPressed ) !== -1 ) {
								event.stopPropagation();
						}
				} );
				return view;
		}


		// prevents the user from opening the popup with click
		function disablePopupOnClick( view ) {
				view.on( "click", function ( event ) {
						event.stopPropagation();
				} );
				return view;
		}


		view.when().then( function () {
				// Create the charts when the view is ready
				createCharts();
		} );


		function createCharts() {
				totalNumber = document.getElementById( "num-cameras" );
				amountCam   = document.getElementById( "amg-type" );
				avgOpenTime = document.getElementById( "avg-open-time" );


				const typeCanvas = document.getElementById( "typeChart" );
				typeChart        = new Chart( typeCanvas.getContext( "2d" ), {
						type   : "horizontalBar",
						data   : {
								labels  : [ "Yawcam", "Android", "DVR", "XP", "Unknown" ],
								datasets: [
										{
												label          : "Open/Inconclusive",
												backgroundColor: "#149dcf",
												stack          : "Stack 0",
												data           : [ 985, 1000, 217, 855, 0 ]
										},
										{
												label          : "Secure/Protected",
												backgroundColor: "#ed5050",
												stack          : "Stack 0",
												data           : [ 1, 0, 1, 0, 0, 0 ]
										}
								]
						},
						options: {
								responsive: false,
								legend    : {
										position: "top"
								},
								title     : {
										display: true,
										text   : "Discovered Webcam Devices"
								},
								scales    : {
										xAxes: [
												{
														stacked: true,
														ticks  : {
																beginAtZero: true
														}
												}
										],
										yAxes: [
												{
														stacked: true
												}
										]
								}
						}
				} );

				const accessibilityCanvas = document.getElementById( "accessibility-chart" );
				accessibilityChart        = new Chart( accessibilityCanvas.getContext( "2d" ), {
						type   : "doughnut",
						data   : {
								labels  : [
										"Open",
										"Inconclusive",
										"Closed"
								],
								datasets: [
										{
												backgroundColor: [ "#149dcf", "#a6c736", "#ed5050" ],
												borderColor    : "rgb(255, 255, 255)",
												borderWidth    : 1,
												data           : [ 925, 1851, 281 ]
										}
								]
						},
						options: {
								responsive      : false,
								cutoutPercentage: 35,
								legend          : {
										position: "bottom"
								},
								title           : {
										display: true,
										text   : "Status of the connection"
								}
						}

				} );
		}

} );
