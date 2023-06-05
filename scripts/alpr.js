require( [
		"esri/Map",
		"esri/views/MapView",
		"esri/WebMap",
		"esri/layers/FeatureLayer",
		"esri/widgets/Legend",
		"esri/widgets/Expand",
		"esri/widgets/Compass",
		"esri/widgets/ScaleBar"
], function (
		Map,
		MapView,
		WebMap,
		FeatureLayer,
		Legend,
		Expand,
		Compass,
		ScaleBar
) {

		const featureLayer = new FeatureLayer( {
				portalItem: {
						id: "242aaaca30264a4e84d4fc17ca43e566"
				}
		} );

		const webmap = new WebMap( {
				portalItem: {
						id: "242aaaca30264a4e84d4fc17ca43e566"
				},
		} );

		var overviewMap = new Map( {
				basemap: "topo-vector",
				layer  : [ featureLayer ]
		} );

		const view = new MapView( {
				map        : webmap,
				container  : "viewDiv",
				center     : [ -122.25, 37.80 ],
				zoom       : 11.5,
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
				center     : [ -122.30, 37.80 ],
				zoom       : 5,
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
										if ( error.name !== "view:goto-interrupted" ) {
												console.error( error );
										}
								} );
						}
				} );
		};


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
		view.when( maintainFixedExtent ).then( disablePopupOnClick ).then( disableNavigation );
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

} );
