Feature: Create mosaic

   Scenario Outline: Creating mosaics
      Given "<alice_privatekey>" want to create a moisaic at "<nodeURL>"
      When Alice add a mosaic named "<mosaicName>" in namespace named "<namespaceName>"
      Then Alice should get a mosaic transaction hash

      Examples:
         | nodeURL                         | alice_privatekey                                                 | namespaceName | mosaicName |
         | http://catapult48gh23s.xyz:3000 | FB8F478A2F5AF85BB5C012EEC3A8AF406FAE1379ABC80822DABC6EFEB671072E | namespace_sig | mosaic_sig |