import {type TreeParams} from './penn.ts'
import { type SpaceColonyParam } from './space-colonization.ts';

export const DefaultSpaceColonyParams : SpaceColonyParam = {
    max_iterations : 200,
    branch_length : 0.2,
    attraction_range : 1.2, 
    kill_range_relative : 0.95,
    branch_randomness : 0.1,
    branch_spread : 0.0,
    inverse_growth_factor : 2.0,
    branch_thickness : 0.01,
    attractors : 3000,
    attractors_radius : 5,
    attractors_height : 5,
    attractors_tall  : 1,
    attractors_shape_mod : -0,
    attractors_noise : 0,
    attraction_up : 0,
    see_attraction_cloud : false,
    leaf_start : 0.2,
    leaves_per_branch : 1,
    is_root : false,
    root_start : 0,
}

export const DefaultRootParams : SpaceColonyParam = {
    max_iterations : 200,
    branch_length : 0.2,
    attraction_range : 2.88, 
    kill_range_relative : 0.96,
    branch_randomness : 0.1,
    branch_spread : 0.0,
    inverse_growth_factor : 4.34,
    branch_thickness : 0.032,
    attractors : 3000,
    attractors_radius : 6.62,
    attractors_height : -0.65,
    attractors_tall  : 0.32,
    attractors_shape_mod : -0,
    attractors_noise : 4.12,
    attraction_up : -0.49,
    see_attraction_cloud : false,
    leaf_start : 0.2,
    leaves_per_branch : 1,
    is_root : true,
    root_start : 3.89,
}

export const QuakingAspen: TreeParams = {
    SpaceColony: false,
    GenerateRoots: false,
    Shape: 7,
    Scale: 13,
    ScaleV: 3,
    Levels: 3,
    RatioPower: 1.2,

    MeshQuality : [10,6,3,3],

    Scale0: 0.1,
    ScaleV0: 0,

    LevelParam: [
    // level 0 (trunk)
    {
        DownAngle: 0,
        DownAngleV: 0,
        Rotate: 0,
        RotateV: 0,
        Branches: 0,
        Length: 1,
        LengthV: 0,
        CurveRes: 20,
        Curve: 0,
        CurveV: 20,
        BaseSize: 0.4,
        Gnarly: 0,
    },
    // level 1
    {
      DownAngle: 60,
      DownAngleV: -50,
      Rotate: 140,
      RotateV: 0,
      Branches: 50,
      Length: 0.3,
      LengthV: 0,
      CurveRes: 5,
      Curve: -40,
      CurveV: 50,
      BaseSize: 0,
        Gnarly: 0,
    },
    // level 2
    {
      DownAngle: 45,
      DownAngleV: 10,
      Rotate: 140,
      RotateV: 0,
      Branches: 30,
      Length: 0.6,
      LengthV: 0,
      CurveRes: 3,
      Curve: -40,
      CurveV: 75,
      BaseSize: 0,
        Gnarly: 0,
    },
    // level 3
    {
      DownAngle: 45,
      DownAngleV: 10,
      Rotate: 77,
      RotateV: 0,
      Branches: 10,
      Length: 1,
      LengthV: 0,
      CurveRes: 1,
      Curve: 0,
      CurveV: 0,
      BaseSize: 0,
        Gnarly: 0,
    },],

    LeavesParam : {
      DownAngle: 45,
      DownAngleV: 10,
      Rotate: 77,
      RotateV: 0,
      Amount: 25,
      LeafScale : 0.17,
      LeafScaleX : 1,
      PhototropicBend : 0.5,
    },
    AttractionUp: 0.5,
    TrunkAttractionUp: 0,
    TextureParam : {
      LeafTexture : 'CommonGreen',
      BarkTexture : 'White',
      LeafHue : 0.0,
    },
    SpaceColonyParam : DefaultSpaceColonyParams, 
    RootParams : DefaultRootParams, 
};

export const Acer: TreeParams = {
    SpaceColony: false,
    GenerateRoots: false,
  Shape: 4,
  Scale: 10,
  ScaleV: 1,
  Levels: 3,
  RatioPower: 1.5,

  MeshQuality : [10,6,3,3],

  Scale0: 0.1,
  ScaleV0: 0,

  LevelParam: [
    // level 0 (trunk)
    {
      DownAngle: 0,
      DownAngleV: 0,
      Rotate: 0,
      RotateV: 0,
      Branches: 1,
      Length: 1,
      LengthV: 0,
      CurveRes: 6,
      Curve: 0,
      CurveV: 200,
      BaseSize: 0.1,
        Gnarly: 0,
    },

    // level 1
    {
      DownAngle: 50,
      DownAngleV: 5,
      Rotate: 140,
      RotateV: 0,
      Branches: 6,
      Length: 0.7,
      LengthV: 0.05,
      CurveRes: 5,
      Curve: 0,
      CurveV: 100,
      BaseSize: 0.4,
        Gnarly: 0,
    },

    // level 2
    {
      DownAngle: 50,
      DownAngleV: 5,
      Rotate: 140,
      RotateV: 0,
      Branches: 20,
      Length: 0.3,
      LengthV: 0.05,
      CurveRes: 3,
      Curve: 0,
      CurveV: 100,
      BaseSize: 0.02,
        Gnarly: 0,
    },

    // level 3
    {
      DownAngle: 45,
      DownAngleV: 10,
      Rotate: 77,
      RotateV: 0,
      Branches: 5,
      Length: 1,
      LengthV: 0,
      CurveRes: 1,
      Curve: 0,
      CurveV: 0,
      BaseSize: 0.02,
        Gnarly: 0,
    },
  ],

  LeavesParam: {
        DownAngle: 45,
        DownAngleV: 10,
        Rotate: 77,
        RotateV: 0,
        Amount: 30,
        LeafScale: 0.2,
        LeafScaleX: 1,
      PhototropicBend : 0.5,
  },

  AttractionUp: 0,
  TrunkAttractionUp: 0,
  TextureParam : {
      LeafTexture : 'MapleRed',
      BarkTexture : 'Common',
      LeafHue : 0.0,
  },
  SpaceColonyParam : DefaultSpaceColonyParams, 
    RootParams : DefaultRootParams, 
};

export const preset_params : TreeParams[] = [QuakingAspen, Acer];
