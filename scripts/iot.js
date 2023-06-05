require( [
		"esri/Map",
		"esri/WebScene",
		"esri/views/MapView",
		"esri/views/SceneView",
		"esri/layers/FeatureLayer",
		"esri/widgets/Legend",
		"esri/widgets/Expand",
		"esri/widgets/ScaleBar",
		"esri/core/watchUtils"
], function (
		Map,
		WebScene,
		MapView,
		SceneView,
		FeatureLayer,
		Legend,
		Expand,
		ScaleBar
) {

		const featureLayer = new FeatureLayer( {
				portalItem: {
						id: "01c7ddf5c8bd47cfaed0cd8e91976b88"
				}
		} );

		const mainMap = new WebScene( {
				portalItem: {
						id: "bc93931ccc13410db3a1c09f67e8d1d4"
				},
				ground    : "world-elevation"
		} );

		var overviewMap = new Map( {
				basemap: "topo-vector",
				layer  : [ featureLayer ]
		} );

		const view = new SceneView( {
				map      : mainMap,
				container: "viewDiv"/*,
					camera: {
					position: {
					spatialReference: {
					latestWkid: 3857,
					wkid: 102100
					},
					x:
					y:
					z:
					},
					heading:
					tilt:
					}*/
		} );



		var scaleBar = new ScaleBar( {
				view: view,
				unit: "dual" // The scale bar displays both metric and non-metric units.
		} );

		var mapView           = new MapView( {
				container  : "overviewDiv",
				center     : [ -98, 37 ],
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


		const legendExpand = new Expand( {
				view    : view,
				content : new Legend( {
						view: view
				} ),
				expanded: view.widthBreakpoint !== "xsmall"
		} );

		view.ui.add( legendExpand, "bottom-left" );
		view.ui.add( scaleBar, { position: "top-left" } );


		view.watch( "widthBreakpoint", function ( newValue ) {
				titleExpand.expanded  = newValue !== "xsmall";
				legendExpand.expanded = newValue !== "xsmall";
		} );

} );
