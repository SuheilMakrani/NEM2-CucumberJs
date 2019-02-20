Feature: Create namespace

   Scenario Outline: registering namespace transaction
      Given "<alice_privatekey>" want to register a namespace at "<nodeURL>"
      When Alice want to register a namespace named "<namespaceName>"
      Then Alice should get a namespace transaction hash

      Examples:
         | nodeURL                         | alice_privatekey                                                 | namespaceName |
         | http://catapult48gh23s.xyz:3000 | FB8F478A2F5AF85BB5C012EEC3A8AF406FAE1379ABC80822DABC6EFEB671072E | namespace_sig |